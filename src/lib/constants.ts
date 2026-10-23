export const APP_CONFIG = {
  name: "FailureTech",
  tagline: "High-Performance Agency Client Portal",
  description: "Enterprise project tracking, communication, and client transparency platform.",
  portalVersion: "v1.0.0-beta",
  supportEmail: "support@failuretech.agency",
};

export interface NavigationItem {
  name: string;
  href: string;
  iconName: "LayoutDashboard" | "FolderKanban" | "LifeBuoy" | "Receipt" | "Settings" | "Users" | "Activity" | "ShieldAlert";
  badge?: string;
  exact?: boolean;
}

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    iconName: "LayoutDashboard",
    exact: true,
  },
  {
    name: "Projects",
    href: "/projects",
    iconName: "FolderKanban",
    badge: "4 Active",
  },
  {
    name: "Support Tickets",
    href: "/tickets",
    iconName: "LifeBuoy",
    badge: "2 Open",
  },
  {
    name: "Invoices & Billing",
    href: "/invoices",
    iconName: "Receipt",
  },
  {
    name: "Agency Admin",
    href: "/admin",
    iconName: "ShieldAlert",
    badge: "Admin",
  },
  {
    name: "Settings",
    href: "/settings",
    iconName: "Settings",
  },
];

export const STATUS_COLORS = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  in_progress: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  under_review: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  completed: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  critical: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  pending: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
} as const;
