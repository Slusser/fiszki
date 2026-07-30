import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { PointsBadge } from "@/components/fiszki/points-badge";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/katalog", label: "Katalog" },
  { to: "/postep", label: "Postęp" },
  { to: "/portfel", label: "Portfel" },
] as const;

export function AppHeader({ points }: { points: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
        <Link to="/katalog" className="font-display text-xl font-black text-primary">
          Fiszki<span className="text-secondary">ES</span>
        </Link>
        <nav className="hidden justify-center gap-1 sm:flex" aria-label="Nawigacja główna">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <PointsBadge points={points} />
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
      <nav
        className="flex gap-1 overflow-x-auto border-t border-border px-5 py-2 sm:hidden"
        aria-label="Nawigacja mobilna"
      >
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground"
            activeProps={{ className: "bg-accent text-accent-foreground" }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
