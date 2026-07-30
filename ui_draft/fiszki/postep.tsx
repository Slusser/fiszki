import { createFileRoute } from "@tanstack/react-router";
import { Flame, Target, Trophy, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/fiszki/app-header";
import { CATEGORIES, POINTS } from "@/lib/catalog-data";
import { WEEK_PROGRESS } from "@/lib/quiz-data";

export const Route = createFileRoute("/postep")({
  head: () => ({
    meta: [
      { title: "Twój postęp — Fiszki ES" },
      {
        name: "description",
        content:
          "Statystyki nauki: seria dni, opanowane słówka, ukończone tiery i aktywność tygodniowa.",
      },
      { property: "og:title", content: "Twój postęp — Fiszki ES" },
      {
        property: "og:description",
        content: "Seria dni, opanowane słówka i aktywność tygodniowa w jednym miejscu.",
      },
    ],
  }),
  component: PostepPage,
});

function PostepPage() {
  const mastered = CATEGORIES.reduce((s, c) => s + c.mastered, 0);
  const total = CATEGORIES.reduce((s, c) => s + c.total, 0);
  const tiers = CATEGORIES.reduce((s, c) => s + c.tiersDone, 0);
  const percent = Math.round((mastered / total) * 100);
  const maxDay = Math.max(...WEEK_PROGRESS.map((d) => d.value));

  const stats = [
    { icon: Flame, label: "Seria dni", value: "4", note: "Rekord: 11" },
    { icon: Target, label: "Opanowane słówka", value: `${mastered}`, note: `z ${total}` },
    { icon: Trophy, label: "Ukończone tiery", value: `${tiers}`, note: "z 36" },
    {
      icon: TrendingUp,
      label: "Skuteczność",
      value: "82%",
      note: "ostatnie 7 dni",
    },
  ];

  return (
    <div className="min-h-dvh">
      <AppHeader points={POINTS} />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <h1 className="font-display text-3xl font-black sm:text-4xl">Twój postęp</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Śledź, ile słówek już opanowałeś i jak regularnie ćwiczysz.
        </p>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="surface-card p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="size-5" aria-hidden />
              </span>
              <dt className="mt-4 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-3xl font-black tabular-nums">{s.value}</dd>
              <p className="text-xs text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </dl>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <section className="surface-card p-6">
            <h2 className="font-display text-xl font-extrabold">Aktywność w tygodniu</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Liczba przerobionych fiszek dziennie.
            </p>
            <ul className="mt-6 flex h-48 items-end gap-3">
              {WEEK_PROGRESS.map((d) => (
                <li key={d.day} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-display text-xs font-bold tabular-nums text-muted-foreground">
                    {d.value}
                  </span>
                  <div
                    className="w-full rounded-t-lg gradient-ember"
                    style={{ height: `${Math.max((d.value / maxDay) * 100, 6)}%` }}
                    role="img"
                    aria-label={`${d.day}: ${d.value} fiszek`}
                  />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {d.day}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="surface-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-extrabold">Postęp kategorii</h2>
              <span className="font-display font-bold tabular-nums text-primary">
                {percent}% całości
              </span>
            </div>
            <ul className="mt-5 space-y-4">
              {CATEGORIES.filter((c) => c.status !== "locked").map((c) => {
                const p = Math.round((c.mastered / c.total) * 100);
                return (
                  <li key={c.id}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-semibold">
                        <span aria-hidden>{c.emoji}</span> {c.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {c.mastered}/{c.total}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={p}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Postęp: ${c.name}`}
                    >
                      <div
                        className="h-full rounded-full bg-copper"
                        style={{ width: `${Math.max(p, 2)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
