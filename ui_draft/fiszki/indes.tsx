import { createFileRoute, Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/fiszki/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Logowanie — Fiszki ES" },
      {
        name: "description",
        content:
          "Zaloguj się do Fiszki ES i wróć do nauki hiszpańskich słówek w krótkich quizach.",
      },
      { property: "og:title", content: "Logowanie — Fiszki ES" },
      {
        property: "og:description",
        content: "Wróć do nauki hiszpańskich słówek w krótkich quizach 1-z-4.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  return (
    <AuthShell
      title="Witaj ponownie"
      subtitle="Zaloguj się, żeby wrócić do swoich kategorii i punktów."
      footer={
        <>
          Nie masz konta?{" "}
          <Link
            to="/auth/register"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Zarejestruj się
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Hasło</Label>
            <span className="text-sm text-muted-foreground">Nie pamiętasz hasła?</span>
          </div>
          <Input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-12 rounded-xl bg-card"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl font-display text-base font-bold shadow-lift"
        >
          {loading ? "Logowanie…" : "Zaloguj się"}
        </Button>
      </form>
    </AuthShell>
  );
}
