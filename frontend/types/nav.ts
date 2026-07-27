import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Renders as the elevated center FAB in the mobile bottom bar, for the role's
   * primary scan/action (Module 0 §2.1). At most one item per role.
   */
  elevated?: boolean;
}
