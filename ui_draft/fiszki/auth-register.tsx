import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/fiszki/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "Rejestracja — Fiszki ES" },
      {
        name: "description",
        content:
          "Załóż konto w Fiszki ES: 10 kategorii na start, quizy 1-z-4 i punkty za postępy.",
      },
      { property: "og:title", content: "Rejestracja — Fiszki ES" },
      {
        property: "og:description",
        content: "10 odblokowanych kategorii na start i punkty za każdy ukończony tier.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      title="Zacznij naukę"
      subtitle="Załóż konto i odbierz 10 odblokowanych kategorii na start."
      footer={
        <>
          Masz już konto?{" "}
          <Link
            to="/"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Zaloguj się
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => navigate({ to: "/katalog" }), 500);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nazwa użytkownika</Label>
          <Input
            id="name"
            required
            autoComplete="nickname"
            placeholder="np. maria_es"
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ty@example.com"
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <Input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Minimum 8 znaków"
            className="h-12 rounded-xl bg-card"
          />
          <p className="text-sm text-muted-foreground">
            Użyj co najmniej 8 znaków, w tym cyfry.
          </p>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl font-display text-base font-bold shadow-lift"
        >
          {loading ? "Tworzenie konta…" : "Załóż konto"}
        </Button>
      </form>
    </AuthShell>
  );
}
