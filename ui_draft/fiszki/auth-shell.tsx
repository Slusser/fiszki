import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Flame, Timer, Trophy } from "lucide-react";
import heroImage from "@/assets/auth-hero.jpg";

const HIGHLIGHTS = [
  { icon: Timer, label: "Sesje po 3 minuty", desc: "30 sekund na pytanie" },
  { icon: Trophy, label: "Punkty i odblokowania", desc: "Nowe kategorie za postępy" },
  { icon: Flame, label: "Trzy poziomy trudności", desc: "Easy · Hard · Expert" },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden gradient-ember p-12 lg:flex lg:flex-col lg:justify-between">
        <img
          src={heroImage}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full object-cover opacity-25 mix-blend-luminosity"
        />
        <Link
          to="/"
          className="relative font-display text-xl font-black text-primary-foreground"
        >
          Fiszki<span className="opacity-70">ES</span>
        </Link>
        <div className="relative max-w-md">
          <h2 className="font-display text-5xl font-black leading-[1.05] text-primary-foreground">
            Hiszpański,
            <br />
            jedno słówko naraz.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-primary-foreground/85">
            Krótkie quizy 1-z-4, natychmiastowy postęp i punkty, które odblokowują
            kolejne kategorie.
          </p>
        </div>
        <ul className="relative space-y-4">
          {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
            <li key={label} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-foreground/15 text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display font-bold text-primary-foreground">
                  {label}
                </span>
                <span className="block text-sm text-primary-foreground/75">{desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center justify-center px-5 py-12 grain-dots sm:px-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 inline-block font-display text-xl font-black text-primary lg:hidden"
          >
            Fiszki<span className="text-secondary">ES</span>
          </Link>
          <h1 className="font-display text-4xl font-black">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </section>
    </main>
  );
}
