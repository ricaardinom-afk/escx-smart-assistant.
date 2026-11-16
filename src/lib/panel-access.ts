export type PanelAccessDecision = "redirect" | "denied" | "allowed";

/** Pure access decision shared by the protected route and routing tests. */
export function panelAccessDecision(
  hasSession: boolean,
  hasAccess: boolean | null,
): PanelAccessDecision {
  if (!hasSession) return "redirect";
  if (hasAccess === false) return "denied";
  return "allowed";
}
