import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/brand/Wordmark";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ESCX Procurement Service — Contacto e atendimento" },
      { name: "description", content: "Fale com a ESCX Procurement Service por email ou WhatsApp. Atendimento humano disponível." },
      { property: "og:title", content: "ESCX Procurement Service" },
      { property: "og:description", content: "Fale com a ESCX Procurement Service por email ou WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2">
        Saltar para o conteúdo
      </a>
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <nav aria-label="Principal" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" aria-label={`${BRAND.name} — início`}><Wordmark /></Link>
          <ul className="flex items-center gap-1 text-sm sm:gap-4">
            <li className="hidden sm:block"><a href="#sobre" className="rounded px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">Sobre</a></li>
            <li><a href="#contacto" className="rounded px-2 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">Contacto</a></li>
            <li><Button asChild size="sm" variant="outline"><Link to="/auth">Área reservada</Link></Button></li>
          </ul>
        </nav>
      </header>

      <main id="conteudo">
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{BRAND.name}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Estamos disponíveis para ouvir a sua solicitação.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-primary-foreground/85">
              Entre em contacto com a nossa equipa por email ou WhatsApp. Respondemos de forma directa e personalizada.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <a href={BRAND.whatsappLink} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true" /> Falar por WhatsApp</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={BRAND.mailto}><Mail aria-hidden="true" /> Enviar email</a>
              </Button>
            </div>
          </div>
        </section>

        <section id="sobre" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
          <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
            <h2 className="text-2xl font-semibold text-primary">Sobre nós</h2>
            <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
              <p>A {BRAND.name} acompanha cada pedido com atenção, desde o primeiro contacto até à resposta final.</p>
              <p>Para conhecer as nossas condições e esclarecer a sua necessidade, fale directamente com a nossa equipa.</p>
            </div>
          </div>
        </section>

        <section id="contacto" className="scroll-mt-20 border-t border-border bg-secondary">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className="text-2xl font-semibold text-primary">Contacto</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a href={BRAND.mailto} className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-ring">
                <Mail className="text-accent" aria-hidden="true" />
                <p className="mt-4 text-sm text-muted-foreground">Email</p>
                <p className="mt-1 text-lg font-medium text-foreground group-hover:text-primary">{BRAND.email}</p>
              </a>
              <a href={BRAND.whatsappLink} target="_blank" rel="noopener noreferrer" className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-ring">
                <MessageCircle className="text-accent" aria-hidden="true" />
                <p className="mt-4 text-sm text-muted-foreground">WhatsApp</p>
                <p className="mt-1 text-lg font-medium text-foreground group-hover:text-primary">{BRAND.whatsappDisplay}</p>
              </a>
            </div>
            <p className="mt-8 rounded-md border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
              O atendimento digital está em preparação. Até lá, a nossa equipa responde pessoalmente pelos contactos acima.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} {BRAND.name}</p>
          <p><a className="hover:text-foreground" href={BRAND.mailto}>{BRAND.email}</a> · <a className="hover:text-foreground" href={BRAND.whatsappLink} target="_blank" rel="noopener noreferrer">{BRAND.whatsappDisplay}</a></p>
        </div>
      </footer>
    </div>
  );
}
