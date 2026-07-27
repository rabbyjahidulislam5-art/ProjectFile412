import type { AuthUser } from "@/types/auth";
import type { NavItem } from "@/types/nav";
import { TopNavBar } from "./top-nav-bar";
import { BottomNavBar } from "./bottom-nav-bar";
import { MobileHeader } from "./mobile-header";

interface AppShellProps {
  user: AuthUser;
  navItems: NavItem[];
  /** The role's home route — used to scope active-link matching. */
  rootHref: string;
  pageTitle: string;
  /** Where the profile dropdown points for this role. */
  profileHref: string;
  showBack?: boolean;
  headerAccessory?: React.ReactNode;
  children: React.ReactNode;
}

// The single persistent chrome for every authenticated screen (Module 0 §2): a
// top nav bar on tablet/desktop, a header + bottom tab bar on mobile. No sidebar.
export function AppShell({
  user,
  navItems,
  rootHref,
  pageTitle,
  profileHref,
  showBack = false,
  headerAccessory,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <TopNavBar navItems={navItems} user={user} rootHref={rootHref} profileHref={profileHref} />
      <MobileHeader title={pageTitle} showBack={showBack} accessory={headerAccessory} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8">{children}</main>
      <BottomNavBar navItems={navItems} rootHref={rootHref} />
    </div>
  );
}
