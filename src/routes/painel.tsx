import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, CalendarDays, ChevronDown, ClipboardList, LayoutDashboard, LogOut,
  MessageSquare, Plus, Search, Settings, ShieldCheck, Trash2, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wordmark } from "@/components/brand/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import {
  createCustomer, deleteCustomer, getDashboard, getMe, listCustomers, updateCustomer,
} from "@/lib/admin.functions";
import {
  canDeleteCustomers, canWriteCustomers, COMMERCIAL_STATUSES, ROLE_LABELS, STATUS_LABELS,
  type AppRole, type CommercialStatus,
} from "@/lib/customers.schema";
import { panelAccessDecision } from "@/lib/panel-access";

type PanelSection = "dashboard" | "clientes" | "agenda" | "conversas" | "configuracoes";
type Me = Awaited<ReturnType<typeof getMe>>;
type Customer = Awaited<ReturnType<typeof listCustomers>>[number];
type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

export const Route = createFileRoute("/painel")({
  ssr: false,
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const decision = panelAccessDecision(Boolean(session), null);
    if (decision === "redirect") throw redirect({ to: "/auth" });

    const me = await getMe();
    if (panelAccessDecision(true, me.hasAccess) === "denied") {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth", search: { semAcesso: true } });
    }
    return { me };
  },
  head: () => ({
    meta: [
      { title: "Painel administrativo — ESCX" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});

const NAV: { id: PanelSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "conversas", label: "Conversas", icon: MessageSquare },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];

function AdminPanel() {
  const { me } = Route.useRouteContext() as { me: Me };
  const [section, setSection] = useState<PanelSection>("dashboard");
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const displayName = me.profile?.full_name?.trim() || me.profile?.email || "Utilizador";
  const roleLabels = me.roles.map((role) => ROLE_LABELS[role]).join(" · ");

  async function signOut() {
    setSigningOut(true);
    setSignOutError(null);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (error) {
      setSignOutError("Não foi possível terminar a sessão. Tente novamente.");
      return;
    }
    window.location.assign("/auth");
  }

  return (
    <div className="min-h-screen bg-secondary/50 text-foreground lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex min-h-screen flex-col border-r border-border bg-card">
        <div className="border-b border-border px-6 py-5">
          <Link to="/" aria-label="ESCX — página inicial"><Wordmark /></Link>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Área reservada</p>
        </div>
        <nav aria-label="Navegação administrativa" className="flex-1 space-y-1 p-4">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              aria-current={section === id ? "page" : undefined}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${section === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {["agenda", "conversas", "configuracoes"].includes(id) && (
                <span className="ml-auto text-[10px] opacity-70">Em breve</span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-md bg-secondary/70 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{roleLabels || "Sem papel atribuído"}</p>
            </div>
          </div>
          {signOutError && <p role="alert" className="mb-2 text-xs text-destructive">{signOutError}</p>}
          <Button variant="outline" className="w-full justify-start" onClick={signOut} disabled={signingOut}>
            <LogOut className="mr-2 size-4" aria-hidden="true" />
            {signingOut ? "A terminar sessão…" : "Terminar sessão"}
          </Button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex min-h-16 items-center justify-between border-b border-border bg-card px-5 py-3 sm:px-8">
          <div>
            <p className="text-xs text-muted-foreground">ESCX Procurement Service</p>
            <h1 className="text-lg font-semibold">{NAV.find((item) => item.id === section)?.label}</h1>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-emerald-500" />
            Sessão autenticada
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-5 sm:p-8">
          {section === "dashboard" && <DashboardView />}
          {section === "clientes" && <CustomersView roles={me.roles} />}
          {["agenda", "conversas", "configuracoes"].includes(section) && (
            <PlaceholderView section={section} />
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDashboard()
      .then((result) => { if (active) setData(result); })
      .catch(() => { if (active) setError("Não foi possível carregar o dashboard. Verifique a ligação e tente novamente."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingState label="A carregar o dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data) return <EmptyState title="Sem dados disponíveis" detail="Ainda não existem métricas para apresentar." />;

  const metrics = [
    { label: "Total de clientes", value: data.total ?? 0, icon: Users },
    { label: "Novos nos últimos 30 dias", value: data.last30 ?? 0, icon: Activity },
  ];
  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm text-muted-foreground">Visão geral</p>
        <h2 className="mt-1 text-2xl font-semibold">Bem-vindo ao painel ESCX</h2>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe a actividade comercial e os clientes da equipa.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-sm">{label}</span><Icon className="size-4" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
        {Object.entries(data.by_status ?? {}).slice(0, 2).map(([status, value]) => (
          <div key={status} className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{STATUS_LABELS[status as CommercialStatus] ?? status}</p>
            <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div><h3 className="font-semibold">Clientes recentes</h3><p className="text-xs text-muted-foreground">Últimos registos na plataforma</p></div>
          <ClipboardList className="size-5 text-muted-foreground" aria-hidden="true" />
        </div>
        {data.recent?.length ? (
          <div className="divide-y divide-border">
            {data.recent.map((customer) => (
              <div key={customer.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                <div><p className="text-sm font-medium">{customer.name}</p><p className="text-xs text-muted-foreground">{customer.company || "Empresa não indicada"}</p></div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{STATUS_LABELS[customer.commercial_status as CommercialStatus] ?? customer.commercial_status}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState title="Ainda sem clientes" detail="Os novos clientes aparecerão aqui." />}
      </section>
    </div>
  );
}

function CustomersView({ roles }: { roles: AppRole[] }) {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const canWrite = canWriteCustomers(roles);
  const canDelete = canDeleteCustomers(roles);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listCustomers({ data: { q: query, status } })
      .then((result) => { if (active) setRows(result); })
      .catch(() => { if (active) setError("Não foi possível carregar os clientes."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, status, refresh]);

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const values = {
      name: String(fd.get("name") ?? "").trim(),
      company: String(fd.get("company") ?? "").trim() || null,
      email: String(fd.get("email") ?? "").trim() || null,
      phone: String(fd.get("phone") ?? "").trim() || null,
      request_type: String(fd.get("request_type") ?? "").trim() || null,
      first_contact_date: String(fd.get("first_contact_date") ?? "") || null,
      commercial_status: String(fd.get("commercial_status") ?? "novo") as CommercialStatus,
      owner_id: null,
      internal_notes: null,
    };
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await updateCustomer({ data: { id: editing.id, values } });
      else await createCustomer({ data: values });
      setEditing(null);
      setCreating(false);
      setRefresh((value) => value + 1);
    } catch {
      setFormError("Não foi possível guardar o cliente. Confirme os dados e as suas permissões.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomer(customer: Customer) {
    if (!window.confirm(`Confirma a eliminação do cliente “${customer.name}”? Esta acção não pode ser anulada.`)) return;
    try {
      await deleteCustomer({ data: { id: customer.id } });
      setRefresh((value) => value + 1);
    } catch {
      setError("Não foi possível eliminar o cliente. Verifique as suas permissões.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm text-muted-foreground">Gestão comercial</p><h2 className="mt-1 text-2xl font-semibold">Clientes</h2><p className="mt-2 text-sm text-muted-foreground">Consulte e acompanhe os registos de clientes.</p></div>
        {canWrite && <Button onClick={() => { setEditing(null); setFormError(null); setCreating(true); }}><Plus className="mr-2 size-4" /> Novo cliente</Button>}
      </div>
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por nome, empresa, email ou telefone" aria-label="Pesquisar clientes" /></div>
        <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filtrar por estado">
          <option value="todos">Todos os estados</option>
          {COMMERCIAL_STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}
        </select>
      </div>
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
      <section className="overflow-hidden rounded-lg border border-border bg-card">
        {loading ? <LoadingState label="A carregar clientes…" /> : rows.length === 0 ? <EmptyState title="Nenhum cliente encontrado" detail="Altere os filtros ou registe um novo cliente." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-secondary/60 text-left text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Cliente</th><th className="px-4 py-3 font-medium">Contacto</th><th className="px-4 py-3 font-medium">Estado</th><th className="px-4 py-3 font-medium">Data de registo</th><th className="px-4 py-3 text-right font-medium">Acções</th></tr></thead>
              <tbody className="divide-y divide-border">
                {rows.map((customer) => (
                  <tr key={customer.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3"><p className="font-medium">{customer.name}</p><p className="text-xs text-muted-foreground">{customer.company || "Empresa não indicada"}</p></td>
                    <td className="px-4 py-3"><p>{customer.email || "—"}</p><p className="text-xs text-muted-foreground">{customer.phone || "—"}</p></td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs">{STATUS_LABELS[customer.commercial_status as CommercialStatus] ?? customer.commercial_status}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(customer.created_at).toLocaleDateString("pt-PT")}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1">
                      {canWrite && <Button size="sm" variant="outline" onClick={() => { setEditing(customer); setFormError(null); }}>Editar</Button>}
                      {canDelete && <Button size="icon" size-variant="icon" variant="ghost" aria-label={`Eliminar ${customer.name}`} onClick={() => removeCustomer(customer)}><Trash2 className="size-4 text-destructive" /></Button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {(creating || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) { setCreating(false); setEditing(null); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="customer-form-title" className="my-8 w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between"><div><h3 id="customer-form-title" className="text-lg font-semibold">{editing ? "Editar cliente" : "Novo cliente"}</h3><p className="text-sm text-muted-foreground">Preencha os dados principais do registo.</p></div><button type="button" aria-label="Fechar" className="rounded p-1 text-muted-foreground hover:bg-secondary" onClick={() => { setCreating(false); setEditing(null); }}><X className="size-5" /></button></div>
            <form onSubmit={saveCustomer} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm"><span>Nome *</span><Input name="name" required minLength={2} defaultValue={editing?.name ?? ""} /></label>
                <label className="space-y-1 text-sm"><span>Empresa</span><Input name="company" defaultValue={editing?.company ?? ""} /></label>
                <label className="space-y-1 text-sm"><span>Email</span><Input name="email" type="email" defaultValue={editing?.email ?? ""} /></label>
                <label className="space-y-1 text-sm"><span>Telefone</span><Input name="phone" defaultValue={editing?.phone ?? ""} /></label>
                <label className="space-y-1 text-sm"><span>Tipo de pedido</span><Input name="request_type" defaultValue={editing?.request_type ?? ""} /></label>
                <label className="space-y-1 text-sm"><span>Primeiro contacto</span><Input name="first_contact_date" type="date" defaultValue={editing?.first_contact_date ?? ""} /></label>
                <label className="space-y-1 text-sm sm:col-span-2"><span>Estado comercial</span><select name="commercial_status" defaultValue={editing?.commercial_status ?? "novo"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">{COMMERCIAL_STATUSES.map((item) => <option key={item} value={item}>{STATUS_LABELS[item]}</option>)}</select></label>
              </div>
              {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => { setCreating(false); setEditing(null); }}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "A guardar…" : "Guardar cliente"}</Button></div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function PlaceholderView({ section }: { section: PanelSection }) {
  const content = {
    agenda: ["Agenda", "A gestão de compromissos e actividades ficará disponível nesta área."],
    conversas: ["Conversas", "A comunicação com clientes será integrada nesta área."],
    configuracoes: ["Configurações", "As preferências e definições da equipa serão geridas nesta área."],
  } as const;
  const [title, description] = content[section as keyof typeof content];
  return <section className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary"><Settings className="size-5 text-muted-foreground" /></div><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p><span className="mt-5 inline-flex rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">Em desenvolvimento</span></section>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-3 p-12 text-sm text-muted-foreground" role="status"><span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />{label}</div>;
}
function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="px-5 py-12 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted-foreground">{detail}</p></div>;
}
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="rounded-lg border border-destructive/30 bg-card p-6 text-center"><p role="alert" className="text-sm text-destructive">{message}</p><Button className="mt-4" variant="outline" onClick={onRetry}>Tentar novamente</Button></div>;
}
