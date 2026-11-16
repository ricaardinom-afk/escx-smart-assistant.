import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COMMERCIAL_STATUSES,
  STATUS_LABELS,
  customerInputSchema,
  type CustomerInput,
} from "@/lib/customers.schema";

type Staff = { id: string; full_name: string | null; email: string | null };
type Initial = Partial<Record<keyof CustomerInput, string | null>>;

export function CustomerForm({
  initial,
  staff,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Initial;
  staff: Staff[];
  submitting: boolean;
  submitLabel: string;
  onSubmit: (values: CustomerInput) => void;
  onCancel?: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>(initial?.commercial_status ?? "novo");
  const [owner, setOwner] = useState<string>(initial?.owner_id ?? "none");

  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries()) as Record<string, string>;
    const parsed = customerInputSchema.safeParse({
      ...raw,
      commercial_status: status,
      owner_id: owner === "none" ? null : owner,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) errs[String(issue.path[0])] ??= issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  const field = (name: keyof CustomerInput, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <Input
        id={`f-${name}`}
        name={name}
        defaultValue={initial?.[name] ?? ""}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `e-${name}` : undefined}
        {...props}
      />
      {errors[name] && (
        <p id={`e-${name}`} className="text-sm text-destructive">
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handle} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Nome *", { required: true, autoComplete: "off" })}
        {field("company", "Empresa")}
        {field("email", "Email", { type: "email" })}
        {field("phone", "Telefone", { type: "tel", placeholder: "+244 ..." })}
        {field("first_contact_date", "Primeiro contacto", { type: "date" })}
        {field("request_type", "Tipo de solicitação")}
        <div className="space-y-1.5">
          <Label htmlFor="f-owner">Responsável</Label>
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger id="f-owner"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {staff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.full_name || s.email || s.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors["owner_id"] && <p className="text-sm text-destructive">{errors["owner_id"]}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-status">Estado comercial *</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="f-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              {COMMERCIAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-internal_notes">Notas internas</Label>
        <Textarea id="f-internal_notes" name="internal_notes" rows={4} defaultValue={initial?.internal_notes ?? ""} aria-invalid={!!errors["internal_notes"]} />
        <p className="text-xs text-muted-foreground">Visíveis apenas para a equipa interna autorizada.</p>
        {errors["internal_notes"] && <p className="text-sm text-destructive">{errors["internal_notes"]}</p>}
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
        <Button type="submit" disabled={submitting}>{submitting ? "A guardar…" : submitLabel}</Button>
      </div>
    </form>
  );
}
