import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  customerFiltersSchema,
  customerInputSchema,
  sanitizeSearch,
  type AppRole,
} from "./customers.schema";

type Ctx = { supabase: any; userId: string };

async function requireRoles(ctx: Ctx, roles: AppRole[]) {
  const { data, error } = await ctx.supabase.rpc("has_any_role", {
    _user_id: ctx.userId,
    _roles: roles,
  });
  if (error) throw new Error("Não foi possível verificar permissões.");
  if (!data) throw new Error("Sem permissão para esta operação.");
}
const ALL: AppRole[] = ["admin", "manager", "operator", "viewer"];
const WRITERS: AppRole[] = ["admin", "manager", "operator"];
const DELETERS: AppRole[] = ["admin", "manager"];

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      context.supabase.from("profiles").select("id,email,full_name,is_active").eq("id", context.userId).maybeSingle(),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    const r = (roles ?? []).map((x) => x.role as AppRole);
    return { profile, roles: r, hasAccess: !!profile?.is_active && r.length > 0 };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context, ALL);
    const { data, error } = await context.supabase.rpc("dashboard_metrics");
    if (error) throw new Error("Não foi possível carregar as métricas.");
    const m = data as { total: number; last30: number; by_status: Record<string, number> };
    const { data: recent } = await context.supabase
      .from("customers")
      .select("id,name,company,commercial_status,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    return { ...m, recent: recent ?? [] };
  });

export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRoles(context, ALL);
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id,full_name,email")
      .eq("is_active", true)
      .order("full_name");
    if (error) throw new Error("Não foi possível carregar a equipa.");
    return data ?? [];
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerFiltersSchema.parse(input ?? {}))
  .handler(async ({ context, data }) => {
    await requireRoles(context, ALL);
    let query = context.supabase
      .from("customers")
      .select("id,name,company,email,phone,commercial_status,request_type,owner_id,first_contact_date,created_at,is_demo")
      .order("created_at", { ascending: false })
      .limit(200);
    const q = sanitizeSearch(data.q);
    if (q) query = query.or(`name.ilike.*${q}*,company.ilike.*${q}*,email.ilike.*${q}*,phone.ilike.*${q}*`);
    if (data.status !== "todos") query = query.eq("commercial_status", data.status);
    const { data: rows, error } = await query;
    if (error) throw new Error("Não foi possível carregar os clientes.");
    return rows ?? [];
  });

const idSchema = z.object({ id: z.string().uuid() });

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireRoles(context, ALL);
    const { data: row, error } = await context.supabase
      .from("customers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error("Não foi possível carregar o cliente.");
    return row;
  });

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => customerInputSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireRoles(context, WRITERS);
    const { data: row, error } = await context.supabase
      .from("customers")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error("Não foi possível criar o cliente.");
    return row;
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), values: customerInputSchema }).parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireRoles(context, WRITERS);
    const { data: row, error } = await context.supabase
      .from("customers")
      .update(data.values)
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (error || !row) throw new Error("Não foi possível actualizar o cliente.");
    return row;
  });

export const deleteCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ context, data }) => {
    await requireRoles(context, DELETERS);
    const { data: rows, error } = await context.supabase
      .from("customers")
      .delete()
      .eq("id", data.id)
      .select("id");
    if (error || !rows?.length) throw new Error("Não foi possível eliminar o cliente.");
    return { ok: true };
  });
