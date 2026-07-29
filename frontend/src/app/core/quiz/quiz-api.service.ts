import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import {
  AnswerQuestionRequest,
  AnswerQuestionResponse,
  ApiSuccessResponse,
  FinishQuizSessionResponse,
  NextQuestionResponse,
  StartQuizSessionRequest,
  StartQuizSessionResponse,
} from '../api/models';

@Injectable({ providedIn: 'root' })
export class QuizApiService {
  private readonly apiClient = inject(ApiClientService);

  startSession(payload: StartQuizSessionRequest): Observable<StartQuizSessionResponse> {
    return this.apiClient
      .post<ApiSuccessResponse<StartQuizSessionResponse>, StartQuizSessionRequest>(
        '/quiz/sessions/start',
        payload,
      )
      .pipe(map((response) => response.data));
  }

  getNextQuestion(sessionId: string): Observable<NextQuestionResponse> {
    return this.apiClient
      .get<ApiSuccessResponse<NextQuestionResponse>>(`/quiz/sessions/${sessionId}/next-question`)
      .pipe(map((response) => response.data));
  }

  answerQuestion(
    sessionId: string,
    payload: AnswerQuestionRequest,
  ): Observable<AnswerQuestionResponse> {
    return this.apiClient
      .post<ApiSuccessResponse<AnswerQuestionResponse>, AnswerQuestionRequest>(
        `/quiz/sessions/${sessionId}/answer`,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  finishSession(sessionId: string): Observable<FinishQuizSessionResponse> {
    return this.apiClient
      .post<ApiSuccessResponse<FinishQuizSessionResponse>, Record<string, never>>(
        `/quiz/sessions/${sessionId}/finish`,
        {},
      )
      .pipe(map((response) => response.data));
  }
}
