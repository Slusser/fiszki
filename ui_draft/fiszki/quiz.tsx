import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Timer, X } from "lucide-react";
import { AppHeader } from "@/components/fiszki/app-header";
import { Button } from "@/components/ui/button";
import { POINTS } from "@/lib/catalog-data";
import { QUIZ_CATEGORY, QUIZ_QUESTIONS, QUIZ_TIER } from "@/lib/quiz-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz 1-z-4 — Fiszki ES" },
      {
        name: "description",
        content:
          "Odpowiadaj na pytania 1-z-4 w 30 sekund i zdobywaj punkty za poprawne słówka.",
      },
      { property: "og:title", content: "Quiz 1-z-4 — Fiszki ES" },
      {
        property: "og:description",
        content: "30 sekund na pytanie, cztery odpowiedzi, punkty za trafienia.",
      },
    ],
  }),
  component: QuizPage,
});

const TOTAL_TIME = 30;

function QuizPage() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(TOTAL_TIME);

  const question = QUIZ_QUESTIONS[index]!;
  const answered = picked !== null;

  useEffect(() => {
    if (answered) return;
    const id = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [answered, index]);

  function pick(i: number) {
    if (answered) return;
    setPicked(i);
    if (i === question.correct) setScore((s) => s + 1);
  }

  function next() {
    setPicked(null);
    setTime(TOTAL_TIME);
    setIndex((i) => (i + 1) % QUIZ_QUESTIONS.length);
  }

  const progress = ((index + (answered ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="min-h-dvh">
      <AppHeader points={POINTS} />

      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="min-h-11 rounded-xl -ml-2" asChild>
            <Link to="/katalog">
              <ArrowLeft className="size-4" aria-hidden /> Katalog
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            {QUIZ_CATEGORY} ·{" "}
            <span className="font-semibold text-secondary">{QUIZ_TIER}</span>
          </p>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Postęp quizu"
          >
            <div
              className="h-full rounded-full gradient-ember transition-[width] duration-500"
              style={{ width: `${Math.max(progress, 3)}%` }}
            />
          </div>
          <span className="font-display text-sm font-bold tabular-nums text-muted-foreground">
            {index + 1}/{QUIZ_QUESTIONS.length}
          </span>
          <span
            className={cn(
              "inline-flex min-w-20 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-display text-sm font-extrabold tabular-nums",
              time <= 10
                ? "bg-destructive/12 text-destructive"
                : "bg-accent text-accent-foreground",
            )}
            aria-label={`Pozostały czas: ${time} sekund`}
          >
            <Timer className="size-4" aria-hidden />
            {time}s
          </span>
        </div>

        <section className="surface-card gradient-warm mt-6 grid place-items-center gap-2 p-10 text-center sm:p-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Przetłumacz
          </p>
          <h1 className="font-display text-4xl font-black sm:text-5xl">
            {question.word}
          </h1>
          <p className="text-muted-foreground">{question.hint}</p>
        </section>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {question.options.map((option, i) => {
            const isCorrect = i === question.correct;
            const state = !answered
              ? "idle"
              : isCorrect
                ? "correct"
                : i === picked
                  ? "wrong"
                  : "dim";
            return (
              <li key={option}>
                <button
                  onClick={() => pick(i)}
                  disabled={answered}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 text-left font-display text-base font-bold transition-all",
                    state === "idle" &&
                      "border-border bg-card hover:-translate-y-0.5 hover:border-primary hover:shadow-lift",
                    state === "correct" &&
                      "border-success bg-success/12 text-success",
                    state === "wrong" &&
                      "border-destructive bg-destructive/12 text-destructive",
                    state === "dim" && "border-border bg-muted/60 text-muted-foreground",
                  )}
                >
                  {option}
                  {state === "correct" && <Check className="size-5" aria-hidden />}
                  {state === "wrong" && <X className="size-5" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Poprawne odpowiedzi:{" "}
            <span className="font-display font-bold text-foreground tabular-nums">
              {score}
            </span>
          </p>
          <Button
            className="min-h-12 rounded-xl px-6 font-display font-bold"
            disabled={!answered}
            onClick={next}
          >
            Następne pytanie
          </Button>
        </div>
      </main>
    </div>
  );
}
