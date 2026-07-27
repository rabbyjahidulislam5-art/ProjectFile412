export type UserRole = "student" | "admin_office" | "library" | "accounts_office" | "shop_staff";

export interface AuthUser {
  id: string;
  role: UserRole;
  studentId: string | null;
  employeeId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  department: string | null;
  batch: string | null;
  mustResetPassword: boolean;
  emailVerified: boolean;
  status: "active" | "suspended";
  createdAt: string;
}
