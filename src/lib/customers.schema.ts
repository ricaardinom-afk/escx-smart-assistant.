import { z } from "zod";

export const COMMERCIAL_STATUSES = [
  "novo",
  "em_contacto",
  "proposta",
  "negociacao",
  "ganho",
  "perdido",
  "inactivo",
] as const;
export type CommercialStatus = (typeof COMMERCIAL_STATUSES)[number];

export const STATUS_LABELS: Record<CommercialStatus, string> = {
  novo: "Novo",
  em_contacto: "Em contacto",
  proposta: "Proposta",
  negociacao: "Em negociação",
  ganho: "Ganho",
  perdido: "Perdido",
  inactivo: "Inactivo",
};

export type AppRole = "admin" | "manager" | "operator" | "viewer";
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  operator: "Operador",
  viewer: "Consulta",
};
export const canWriteCustomers = (roles: AppRole[]) =>
  roles.some((r) => r === "admin" || r === "manager" || r === "operator");
export const canDeleteCustomers = (roles: AppRole[]) =>
  roles.some((r) => r === "admin" || r === "manager");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const customerInputSchema = z.object({
  name: z
    .string({ required_error: "Indique o nome." })
    .trim()
    .min(2, "O nome deve ter pelo menos 2 caracteres.")
    .max(160, "Máximo de 160 caracteres."),
  company: optionalText(160),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform((v) => (v ? v.toLowerCase() : null))
    .refine((v) => v === null || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Email inválido."),
  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\+?[0-9 ()-]{6,25}$/.test(v), "Telefone inválido."),
  first_contact_date: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida."),
  request_type: optionalText(160),
  owner_id: z
    .string()
    .uuid("Responsável inválido.")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null))
    .transform((v) => v ?? null),
  commercial_status: z.enum(COMMERCIAL_STATUSES, {
    errorMap: () => ({ message: "Estado comercial inválido." }),
  }),
  internal_notes: optionalText(5000),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

export const customerFiltersSchema = z.object({
  q: z.string().trim().max(100).optional().default(""),
  status: z.enum([...COMMERCIAL_STATUSES, "todos"]).optional().default("todos"),
});

/** Remove characters with meaning in PostgREST filter syntax. */
export const sanitizeSearch = (q: string) => q.replace(/[,()*%\\:."']/g, " ").trim();
