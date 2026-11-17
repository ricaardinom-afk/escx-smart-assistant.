import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  MoveRight,
  Sparkles,
} from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import {
  BRAND,
  CALENDLY_IN_PERSON_URL,
  CALENDLY_ONLINE_URL,
} from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ESCX | Atendimento e agendamento" },
      {
        name: "description",
        content:
          "Solicite uma cotação, marque uma reunião presencial ou online, ou fale directamente com a ESCX Procurement Service.",
      },
      { property: "og:title", content: "ESCX Procurement Service" },
      {
        property: "og:description",
        content: "O próximo passo para a sua empresa começa com uma conversa.",
      },
      { property: "og:type", content: "website" },
      { name: "theme-color", content: "#3D4B7F" },
    ],
  }),
  component: Landing,
});

const messageLink = (message: string) =>
  `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(message)}`;

const emailLink = (subject: string, body: string) =>
  `${BRAND.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

function ContactActions({
  whatsappMessage,
  emailSubject,
  emailBody,
}: {
  whatsappMessage: string;
  emailSubject: string;
  emailBody: string;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <a
        href={messageLink(whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#3D4B7F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303c68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E39F3E]"
      >
        <MessageCircle size={17} aria-hidden="true" />
        Continuar pelo WhatsApp
        <ArrowUpRight size={16} aria-hidden="true" />
      </a>
      <a
        href={emailLink(emailSubject, emailBody)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#3D4B7F]/20 bg-white px-5 py-3 text-sm font-semibold text-[#3D4B7F] transition hover:border-[#E39F3E] hover:bg-[#fbfaf7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E39F3E]"
      >
        <Mail size={17} aria-hidden="true" />
        Enviar por email
      </a>
    </div>
  );
}

function BookingOption({
  title,
  description,
  icon: Icon,
  href,
  mode,
}: {
  title: string;
  description: string;
  icon: typeof MapPin;
  href: string;
  mode: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#3D4B7F]/10 bg-white p-6 shadow-[0_12px_40px_rgba(35,48,86,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(35,48,86,0.11)]">
      <div className="flex size-12 items-center justify-center rounded-xl bg-[#E39F3E]/15 text-[#3D4B7F]">
        <Icon size={22} aria-hidden="true" />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#B77720]">
        {mode}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-[#26345F]">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
        {description}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3D4B7F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#303c68] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E39F3E]"
        >
          Ver horários disponíveis
          <MoveRight size={16} aria-hidden="true" />
        </a>
      ) : (
        <div className="mt-6 flex min-h-11 items-center gap-2 rounded-full bg-slate-100 px-4 py-3 text-xs font-medium text-slate-500">
          <Clock3 size={15} aria-hidden="true" />
          Agendamento em configuração
        </div>
      )}
    </article>
  );
}

function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F8F8F6] text-[#202B4C]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3"
      >
        Saltar para o conteúdo
      </a>

      <header className="relative z-10 border-b border-[#3D4B7F]/10 bg-white/90 backdrop-blur">
        <nav
          aria-label="Principal"
          className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"
        >
          <a href="#inicio" aria-label={`${BRAND.name} — início`}>
            <Wordmark />
          </a>
          <a
            href="#contacto"
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#3D4B7F]/15 px-4 py-2 text-sm font-semibold text-[#3D4B7F] transition hover:border-[#E39F3E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E39F3E]"
          >
            Fale connosco
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </nav>
      </header>

      <main id="conteudo">
        <section id="inicio" className="relative isolate bg-[#3D4B7F] text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 -top-40 size-[32rem] rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 size-[22rem] rounded-full border border-white/10"
          />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                <Sparkles size={14} className="text-[#E39F3E]" aria-hidden="true" />
                Atendimento ESCX
              </div>
              <h1 className="mt-7 text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
                Boas parcerias começam com uma boa conversa.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Estamos disponíveis para conhecer os seus desafios, responder
                às suas questões e explorar novas oportunidades de colaboração.
              </p>
              <a
                href="#opcoes"
                className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#E39F3E] px-6 py-3 text-sm font-bold text-[#202B4C] transition hover:bg-[#efb45e] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Escolher como começar
                <MoveRight size={17} aria-hidden="true" />
              </a>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9B66D]">
                  ESCX Procurement Service
                </p>
                <p className="mt-5 text-2xl font-semibold leading-snug">
                  O que precisa de tratar hoje?
                </p>
                <div className="mt-7 space-y-3">
                  {[
                    ["Solicitar uma cotação", "Apresente o que procura."],
                    ["Marcar uma reunião", "Escolha o formato e o horário."],
                    ["Conhecer a ESCX", "Comece por falar connosco."],
                  ].map(([title, subtitle], index) => (
                    <a
                      key={title}
                      href={index === 1 ? "#reunioes" : "#opcoes"}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.07] p-4 transition hover:bg-white/[0.13] focus-visible:outline-2 focus-visible:outline-[#E39F3E]"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E39F3E] text-sm font-bold text-[#26345F]">
                        0{index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{title}</span>
                        <span className="mt-1 block text-xs text-white/60">{subtitle}</span>
                      </span>
                      <ArrowUpRight size={16} className="text-[#E9B66D]" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 -z-10 size-28 rounded-full bg-[#E39F3E]/30 blur-2xl" />
            </div>
          </div>
          <div className="h-1.5 bg-[#E39F3E]" />
        </section>

        <section id="opcoes" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B77720]">
              Estamos aqui para ajudar
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#26345F] sm:text-4xl">
              Como podemos ajudar?
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Escolha a opção mais adequada. Será encaminhado directamente para
              o canal de atendimento da sua preferência.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-[#3D4B7F]/10 bg-white p-7 shadow-[0_12px_40px_rgba(35,48,86,0.05)] sm:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#E39F3E]/15 text-[#3D4B7F]">
                <FileText size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#26345F]">
                Solicitar uma cotação
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Partilhe connosco o que pretende e receba acompanhamento da
                nossa equipa.
              </p>
              <ContactActions
                whatsappMessage="Olá, ESCX. Gostaria de solicitar uma cotação. Podem ajudar-me, por favor?"
                emailSubject="Pedido de cotação"
                emailBody="Olá, equipa ESCX.\n\nGostaria de solicitar uma cotação.\n\nObrigado."
              />
            </article>

            <article className="rounded-2xl border border-[#3D4B7F]/10 bg-white p-7 shadow-[0_12px_40px_rgba(35,48,86,0.05)] sm:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#E39F3E]/15 text-[#3D4B7F]">
                <CalendarDays size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[#26345F]">
                Marcar uma reunião
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Seleccione o formato que prefere e escolha directamente um
                horário disponível na agenda.
              </p>
              <div id="reunioes" className="mt-6 grid gap-4 sm:grid-cols-2">
                <BookingOption
                  title="Presencial"
                  description="Para conversas e encontros nas nossas instalações."
                  icon={MapPin}
                  href={CALENDLY_IN_PERSON_URL}
                  mode="Nas nossas instalações"
                />
                <BookingOption
                  title="Online"
                  description="Para reunir à distância, com toda a conveniência."
                  icon={Monitor}
                  href={CALENDLY_ONLINE_URL}
                  mode="Por videochamada"
                />
              </div>
              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-slate-500">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#B77720]" aria-hidden="true" />
                A confirmação é apresentada automaticamente após seleccionar
                um horário no Calendly.
              </p>
            </article>

            <article className="rounded-2xl border border-[#3D4B7F]/10 bg-white p-7 shadow-[0_12px_40px_rgba(35,48,86,0.05)] sm:col-span-2 sm:p-8">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#E39F3E]/15 text-[#3D4B7F]">
                <MessageCircle size={22} aria-hidden="true" />
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <h3 className="text-xl font-semibold text-[#26345F]">
                    Saber mais sobre a ESCX
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Tem dúvidas ou pretende conhecer melhor a nossa empresa?
                    Envie-nos uma mensagem e teremos todo o gosto em conversar.
                  </p>
                </div>
                <ContactActions
                  whatsappMessage="Olá, ESCX. Gostaria de saber mais sobre a empresa e perceber de que forma me podem ajudar."
                  emailSubject="Informações sobre a ESCX"
                  emailBody="Olá, equipa ESCX.\n\nGostaria de saber mais sobre a empresa e os vossos serviços.\n\nObrigado."
                />
              </div>
            </article>
          </div>
        </section>

        <section className="border-y border-[#3D4B7F]/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-3">
            {[
              ["01", "Escolha", "Seleccione o assunto ou o tipo de reunião."],
              ["02", "Contacto", "Continue por WhatsApp, email ou Calendly."],
              ["03", "Confirmação", "Receba a confirmação da reunião pelo Calendly."],
            ].map(([number, title, description]) => (
              <div key={number} className="flex gap-4">
                <span className="text-sm font-bold tracking-widest text-[#B77720]">{number}</span>
                <div>
                  <h3 className="font-semibold text-[#26345F]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="contacto" className="scroll-mt-8 bg-[#3D4B7F] text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-14 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E9B66D]">
                Contacto directo
              </p>
              <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                Estamos à sua disposição.
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Escolha o canal mais conveniente para si.
              </p>
            </div>
            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center">
              <a
                href={BRAND.mailto}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 px-5 py-3 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#E39F3E]"
              >
                <Mail size={16} aria-hidden="true" />
                {BRAND.email}
              </a>
              <a
                href={BRAND.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E39F3E] px-5 py-3 font-semibold text-[#202B4C] transition hover:bg-[#efb45e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <MessageCircle size={16} aria-hidden="true" />
                {BRAND.whatsappDisplay}
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#26345F] text-white/65">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {BRAND.name}. Todos os direitos reservados.</p>
          <p>Atendimento simples. Relações de confiança.</p>
        </div>
      </footer>
    </div>
  );
}
