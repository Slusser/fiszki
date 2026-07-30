import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function PointsBadge({
  points,
  className,
  size = "md",
}: {
  points: number;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border border-copper/40 bg-accent font-display font-extrabold text-accent-foreground tabular-nums",
        size === "md" ? "px-4 py-2 text-base" : "px-3 py-1 text-sm",
        className,
      )}
      aria-label={`Twoje punkty: ${points}`}
    >
      <Coins className={size === "md" ? "size-4.5" : "size-3.5"} aria-hidden />
      {points.toLocaleString("pl-PL")}
      <span className="font-medium opacity-70">pkt</span>
    </span>
  );
}
