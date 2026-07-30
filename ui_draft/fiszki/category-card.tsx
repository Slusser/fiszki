import { Lock, Play, Sparkles, Check } from "lucide-react";
import type { Category } from "@/lib/catalog-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TIERS = ["Easy", "Hard", "Expert"];

export function CategoryCard({
  category,
  points,
}: {
  category: Category;
  points: number;
}) {
  const locked = category.status === "locked";
  const complete = category.tiersDone === 3;
  const percent = Math.round((category.mastered / category.total) * 100);
  const affordable = points >= category.cost;

  return (
    <article
      className={cn(
        "surface-card group relative flex flex-col gap-5 p-5 transition-all duration-300",
        locked
          ? "border-dashed bg-muted/50"
          : "hover:-translate-y-1 hover:shadow-lift",
      )}
    >
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl text-xl",
            locked ? "bg-muted" : "bg-accent",
          )}
          aria-hidden
        >
          {locked ? <Lock className="size-5 text-muted-foreground" /> : category.emoji}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-extrabold leading-tight">
            {category.name}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {category.words} słówek · 3 tiery
          </p>
        </div>
        {complete && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
            <Check className="size-3.5" aria-hidden /> Ukończona
          </span>
        )}
      </header>

      {locked ? (
        <p className="text-sm text-muted-foreground">
          Odblokuj tę kategorię, aby zacząć naukę nowych słówek.
        </p>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Opanowane {category.mastered}/{category.total}
            </span>
            <span className="font-display font-bold tabular-nums">{percent}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Postęp kategorii ${category.name}`}
          >
            <div
              className="h-full rounded-full gradient-ember transition-[width] duration-500"
              style={{ width: `${Math.max(percent, 2)}%` }}
            />
          </div>
          <ul className="flex gap-1.5 pt-1">
            {TIERS.map((tier, i) => (
              <li
                key={tier}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 text-center text-xs font-semibold",
                  i < category.tiersDone
                    ? "bg-success/15 text-success"
                    : i === category.tiersDone
                      ? "bg-copper/25 text-secondary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {tier}
              </li>
            ))}
          </ul>
        </div>
      )}

      {locked ? (
        <Button
          variant={affordable ? "secondary" : "outline"}
          className="w-full min-h-11 rounded-xl font-display font-bold"
          disabled={!affordable}
        >
          <Sparkles className="size-4" aria-hidden />
          {affordable
            ? `Odblokuj za ${category.cost.toLocaleString("pl-PL")} pkt`
            : `Brakuje Ci ${(category.cost - points).toLocaleString("pl-PL")} pkt`}
        </Button>
      ) : (
        <Button className="w-full min-h-11 rounded-xl font-display font-bold">
          <Play className="size-4" aria-hidden />
          {category.tiersDone > 0 ? "Kontynuuj naukę" : "Rozpocznij naukę"}
        </Button>
      )}
    </article>
  );
}
