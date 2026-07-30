import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:3000/v1';
const authToken = __ENV.AUTH_TOKEN ?? 'dev-test-token';
const categoryId =
  __ENV.CATEGORY_ID ?? '00000000-0000-4000-8000-000000000001';
const tier = __ENV.QUIZ_TIER ?? 'easy';

const startTrend = new Trend('quiz_start_ms');
const nextTrend = new Trend('quiz_next_question_ms');
const answerTrend = new Trend('quiz_answer_ms');
const finishTrend = new Trend('quiz_finish_ms');
const flowErrorRate = new Rate('quiz_flow_error_rate');

export const options = {
  scenarios: {
    single_user_smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '20s',
      exec: 'runQuizFlow',
    },
    ten_users_burst: {
      executor: 'constant-vus',
      vus: 10,
      duration: '20s',
      exec: 'runQuizFlow',
      startTime: '20s',
    },
    fifty_users_burst: {
      executor: 'constant-vus',
      vus: 50,
      duration: '20s',
      exec: 'runQuizFlow',
      startTime: '40s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    quiz_flow_error_rate: ['rate<0.01'],
    quiz_start_ms: ['p(95)<300'],
    quiz_next_question_ms: ['p(95)<300'],
    quiz_answer_ms: ['p(95)<300'],
    quiz_finish_ms: ['p(95)<300'],
  },
};

function authHeaders() {
  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
}

function unwrapData(response) {
  if (!response || response.status < 200 || response.status >= 300) {
    return null;
  }

  try {
    const body = JSON.parse(response.body);
    return body?.data ?? null;
  } catch {
    return null;
  }
}

function hasServerError(response) {
  return !response || response.status >= 500;
}

export function runQuizFlow() {
  let failed = false;

  const startPayload = JSON.stringify({
    categoryId,
    tier,
  });
  const startResponse = http.post(
    `${baseUrl}/quiz/sessions/start`,
    startPayload,
    authHeaders(),
  );
  startTrend.add(startResponse.timings.duration);

  const startOk = check(startResponse, {
    'start returns 2xx': (res) => res.status >= 200 && res.status < 300,
  });
  if (!startOk || hasServerError(startResponse)) {
    failed = true;
  }

  const startData = unwrapData(startResponse);
  const sessionId = startData?.sessionId;
  if (!sessionId) {
    flowErrorRate.add(1);
    return;
  }

  const nextResponse = http.get(
    `${baseUrl}/quiz/sessions/${sessionId}/next-question`,
    authHeaders(),
  );
  nextTrend.add(nextResponse.timings.duration);
  const nextOk = check(nextResponse, {
    'next-question returns 2xx': (res) => res.status >= 200 && res.status < 300,
  });
  if (!nextOk || hasServerError(nextResponse)) {
    failed = true;
  }

  const nextData = unwrapData(nextResponse);
  const questionToken = nextData?.question?.questionToken;
  const selectedOption =
    nextData?.question?.options?.[0] ?? __ENV.FALLBACK_ANSWER ?? 'fallback';

  if (questionToken) {
    const answerPayload = JSON.stringify({
      questionToken,
      selectedOption,
    });
    const answerResponse = http.post(
      `${baseUrl}/quiz/sessions/${sessionId}/answer`,
      answerPayload,
      authHeaders(),
    );
    answerTrend.add(answerResponse.timings.duration);
    const answerOk = check(answerResponse, {
      'answer returns 2xx': (res) => res.status >= 200 && res.status < 300,
    });
    if (!answerOk || hasServerError(answerResponse)) {
      failed = true;
    }
  }

  const finishResponse = http.post(
    `${baseUrl}/quiz/sessions/${sessionId}/finish`,
    null,
    authHeaders(),
  );
  finishTrend.add(finishResponse.timings.duration);
  const finishOk = check(finishResponse, {
    'finish returns <500': (res) => res.status < 500,
  });
  if (!finishOk || hasServerError(finishResponse)) {
    failed = true;
  }

  flowErrorRate.add(failed ? 1 : 0);
}
