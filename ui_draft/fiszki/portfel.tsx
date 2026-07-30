import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Coins, Lock, Sparkles } from "lucide-react";
import { AppHeader } from "@/components/fiszki/app-header";
import { Button } from "@/components/ui/button";
import { CATEGORIES, POINTS } from "@/lib/catalog-data";
import { WALLET_HISTORY } from "@/lib/quiz-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portfel")({
  head: () => ({
    meta: [
      { title: "Portfel punktów — Fiszki ES" },
      {
        name: "description",
        content:
          "Saldo punktów, historia zdobyć i wydatków oraz kategorie gotowe do odblokowania.",
      },
      { property: "og:title", content: "Portfel punktów — Fiszki ES" },
      {
        property: "og:description",
        content: "Saldo, historia transakcji i kategorie do odblokowania za punkty.",
      },
    ],
  }),
  component: PortfelPage,
});

function PortfelPage() {
  const earned = WALLET_HISTORY.filter((e) => e.amount > 0).reduce(
    (s, e) => s + e.amount,
    0,
  );
  const spent = WALLET_HISTORY.filter((e) => e.amount < 0).reduce(
    (s, e) => s + Math.abs(e.amount),
    0,
  );
  const locked = CATEGORIES.filter((c) => c.status === "locked").sort(
    (a, b) => a.cost - b.cost,
  );

  return (
    <div className="min-h-dvh">
      <AppHeader points={POINTS} />

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <section className="surface-card gradient-warm grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Coins className="size-4" aria-hidden /> Portfel
            </p>
            <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">
              Saldo punktów
            </h1>
            <p className="mt-1 font-display text-5xl font-black tabular-nums text-primary">
              {POINTS.toLocaleString("pl-PL")}
              <span className="ml-2 text-lg font-bold text-muted-foreground">pkt</span>
            </p>
            <p className="mt-2 max-w-md text-muted-foreground">
              Punkty zdobywasz za ukończone quizy i tiery. Wymieniaj je na nowe kategorie.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 lg:w-72">
            <div className="rounded-xl border border-border bg-card px-3 py-4 text-center">
              <dt className="text-xs font-medium text-muted-foreground">Zdobyte</dt>
              <dd className="mt-1 font-display text-xl font-black tabular-nums text-success">
                +{earned}
              </dd>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-4 text-center">
              <dt className="text-xs font-medium text-muted-foreground">Wydane</dt>
              <dd className="mt-1 font-display text-xl font-black tabular-nums text-secondary">
                −{spent}
              </dd>
            </div>
          </dl>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <section className="surface-card p-6">
            <h2 className="font-display text-xl font-extrabold">Historia punktów</h2>
            <ul className="mt-4 divide-y divide-border">
              {WALLET_HISTORY.map((e) => {
                const positive = e.amount > 0;
                return (
                  <li key={e.id} className="flex items-center gap-3 py-3.5">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl",
                        positive
                          ? "bg-success/12 text-success"
                          : "bg-secondary/10 text-secondary",
                      )}
                      aria-hidden
                    >
                      {positive ? (
                        <ArrowDownLeft className="size-5" />
                      ) : (
                        <ArrowUpRight className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{e.label}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {e.detail} · {e.date}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 font-display font-extrabold tabular-nums",
                        positive ? "text-success" : "text-secondary",
                      )}
                    >
                      {positive ? "+" : "−"}
                      {Math.abs(e.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="surface-card p-6">
            <h2 className="font-display text-xl font-extrabold">Do odblokowania</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kategorie posortowane od najtańszej.
            </p>
            <ul className="mt-4 space-y-3">
              {locked.map((c) => {
                const affordable = POINTS >= c.cost;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-lg">
                      {affordable ? (
                        c.emoji
                      ) : (
                        <Lock className="size-4 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {c.cost.toLocaleString("pl-PL")} pkt
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={affordable ? "secondary" : "outline"}
                      disabled={!affordable}
                      className="min-h-10 shrink-0 rounded-xl font-display font-bold"
                    >
                      <Sparkles className="size-4" aria-hidden />
                      {affordable ? "Odblokuj" : "Za mało"}
                    </Button>
                  </li>
                );
              })}
            </ul>
            <Button variant="ghost" className="mt-4 w-full min-h-11 rounded-xl" asChild>
              <Link to="/katalog">Przejdź do katalogu</Link>
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
