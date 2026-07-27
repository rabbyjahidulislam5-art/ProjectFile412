import "server-only";
import { cookies } from "next/headers";
import type { AuthUser } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Server Component helper: forwards the incoming request's cookies to the API
// so `GET /api/auth/me` can authenticate the same session.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const { user } = (await response.json()) as { user: AuthUser };
  return user;
}
