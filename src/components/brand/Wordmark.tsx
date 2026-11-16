import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Temporary text-only wordmark. The official ESCX logo and brand manual have not
 * been supplied yet, so no logo shape is drawn here.
 */
export function Wordmark({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-sans", className)}>
      <span className={cn("text-xl font-bold tracking-[0.18em]", inverted ? "text-primary-foreground" : "text-primary")}>
        {BRAND.shortName}
      </span>
      <span className="h-3 w-px self-center bg-accent" aria-hidden="true" />
      <span className={cn("text-xs font-medium uppercase tracking-[0.2em]", inverted ? "text-primary-foreground/80" : "text-muted-foreground")}>
        Procurement Service
      </span>
    </span>
  );
}
