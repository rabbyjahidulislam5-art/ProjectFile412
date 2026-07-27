import { redirect } from "next/navigation";
import { StudentShell } from "@/components/student/student-shell";
import { getCurrentUser } from "@/lib/session";

// Server-side role gate for every /student route. The API re-checks the role on
// every call regardless — this only prevents rendering a dashboard the user
// has no business seeing.
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");
  if (user.mustResetPassword) redirect("/set-new-password");
  if (user.role !== "student") redirect("/");

  return <StudentShell user={user}>{children}</StudentShell>;
}
