import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wordmark } from "@/components/brand/Wordmark";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { semAcesso?: boolean | undefined } => ({
    semAcesso: search["semAcesso"] === true || search["semAcesso"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Acesso administrativo — ESCX" },
      { name: "description", content: "Área reservada à equipa ESCX Procurement Service." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Acesso administrativo — ESCX" },
      { property: "og:description", content: "Área reservada à equipa ESCX." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { semAcesso } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) return setError("Indique o email e a palavra-passe.");
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError("Credenciais inválidas ou conta sem acesso.");
    navigate({ to: "/painel", replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <Link to="/" aria-label="Voltar ao início"><Wordmark /></Link>
        <h1 className="mt-8 text-xl font-semibold">Acesso administrativo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Área reservada à equipa interna. Contas criadas apenas pela administração.</p>
        {semAcesso && <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Sem acesso. A sua sessão foi terminada porque esta conta não tem um perfil activo com um papel autorizado.</p>}
        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "A entrar…" : "Entrar"}</Button>
        </form>
      </div>
    </main>
  );
}
