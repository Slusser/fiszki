import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LogOut, Search, Flame } from "lucide-react";
import { CATEGORIES, POINTS, type Category } from "@/lib/catalog-data";
import { CategoryCard } from "@/components/fiszki/category-card";
import { PointsBadge } from "@/components/fiszki/points-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/katalog")({
  head: () => ({
    meta: [
      { title: "Katalog kategorii — Fiszki ES" },
      {
        name: "description",
        content:
          "Przeglądaj kategorie słówek, śledź postęp tierów i odblokowuj nowe zestawy za punkty.",
      },
      { property: "og:title", content: "Katalog kategorii — Fiszki ES" },
      {
        property: "og:description",
        content: "Kategorie słówek, postęp tierów i odblokowania za punkty.",
      },
    ],
  }),
  component: KatalogPage,
});

const FILTERS = [
  { id: "all", label: "Wszystkie" },
  { id: "in-progress", label: "W trakcie" },
  { id: "unlocked", label: "Odblokowane" },
  { id: "locked", label: "Zablokowane" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function matches(c: Category, filter: FilterId) {
  if (filter === "all") return true;
  if (filter === "unlocked") return c.status !== "locked";
  return c.status === filter;
}

function KatalogPage() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      CATEGORIES.filter(
        (c) =>
          matches(c, filter) &&
          c.name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [filter, query],
  );

  const unlocked = CATEGORIES.filter((c) => c.status !== "locked").length;
  const tiers = CATEGORIES.reduce((sum, c) => sum + c.tiersDone, 0);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
          <Link to="/" className="font-display text-xl font-black text-primary">
            Fiszki<span className="text-secondary">ES</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <PointsBadge points={POINTS} />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Wyloguj się"
              className="min-h-11 min-w-11 rounded-xl"
              asChild
            >
              <Link to="/">
                <LogOut className="size-5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
        <section className="surface-card gradient-warm grid gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Flame className="size-4" aria-hidden /> Seria 4 dni
            </p>
            <h1 className="mt-3 font-display text-3xl font-black sm:text-4xl">
              Katalog kategorii
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Wybierz kategorię, przejdź tiery Easy · Hard · Expert i zdobywaj punkty na
              odblokowanie kolejnych zestawów.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 lg:w-80">
            {[
              { label: "Odblokowane", value: `${unlocked}/${CATEGORIES.length}` },
              { label: "Ukończone tiery", value: tiers },
              { label: "Punkty", value: POINTS.toLocaleString("pl-PL") },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-card px-3 py-4 text-center"
              >
                <dt className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-display text-xl font-black tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Szukaj kategorii…"
              aria-label="Szukaj kategorii"
              className="h-12 rounded-xl bg-card pl-10"
            />
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filtruj kategorie"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "min-h-11 rounded-xl border px-4 text-sm font-semibold transition-colors",
                  filter === f.id
                    ? "border-transparent bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="surface-card mt-8 grid place-items-center gap-3 p-14 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-muted text-2xl">
              🔍
            </span>
            <h2 className="font-display text-xl font-extrabold">Brak wyników</h2>
            <p className="max-w-sm text-muted-foreground">
              Nie znaleźliśmy kategorii pasującej do filtrów. Spróbuj innej frazy.
            </p>
            <Button
              variant="secondary"
              className="mt-2 min-h-11 rounded-xl"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Wyczyść filtry
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((c) => (
              <li key={c.id}>
                <CategoryCard category={c} points={POINTS} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
