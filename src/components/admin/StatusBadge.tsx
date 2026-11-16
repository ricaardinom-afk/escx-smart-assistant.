import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type CommercialStatus } from "@/lib/customers.schema";

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status as CommercialStatus] ?? status;
  const variant = status === "ganho" ? "default" : status === "perdido" || status === "inactivo" ? "outline" : "secondary";
  return <Badge variant={variant}>{label}</Badge>;
}
