import type { UserRole } from "@/types/auth";

// Each role's landing route after login. Only the student dashboard exists so
// far; the remaining roles are added as their modules are built.
const ROLE_HOME: Partial<Record<UserRole, string>> = {
  student: "/student",
};

export function roleHome(role: UserRole): string | null {
  return ROLE_HOME[role] ?? null;
}
