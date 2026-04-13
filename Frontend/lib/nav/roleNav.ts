import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Dumbbell,
  Calendar,
  TrendingUp,
  QrCode,
  Users,
  Wrench,
  BarChart3,
  FileText,
  UserCheck,
  Settings,
  Activity,
  CreditCard,
  ShieldCheck,
  Package,
  Tag,
  AlertTriangle,
  CalendarOff,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

/** Primary destinations shown on the mobile bottom bar before the Profile link. */
export const BOTTOM_NAV_PRIMARY_COUNT = 3;

export function navForRole(role: string): NavItem[] {
  switch (role) {
    case "member":
      return [
        { label: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard },
        { label: "Check-in", href: "/member/checkin", icon: QrCode },
        { label: "Workouts", href: "/member/workouts", icon: Dumbbell },
        { label: "My Subscription", href: "/member/subscription", icon: CreditCard },
        { label: "Appointments", href: "/member/appointments", icon: Calendar },
        { label: "Progress & Stats", href: "/member/progress", icon: TrendingUp },
      ];
    case "trainer":
      return [
        { label: "Dashboard", href: "/trainer/dashboard", icon: LayoutDashboard },
        { label: "Check-in", href: "/trainer/checkin", icon: QrCode },
        { label: "Users", href: "/trainer/members", icon: Users },
        { label: "My Schedule", href: "/trainer/schedule", icon: Calendar },
        { label: "Equipment", href: "/trainer/equipment", icon: Wrench },
        { label: "Inventory", href: "/trainer/inventory", icon: Package },
      ];
    case "manager":
      return [
        { label: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
        { label: "Check-in", href: "/manager/checkin", icon: QrCode },
        { label: "Reports", href: "/manager/reports", icon: FileText },
        { label: "Insights", href: "/manager/insights", icon: BarChart3 },
        { label: "Members", href: "/manager/members", icon: Users },
        { label: "Team", href: "/manager/staff", icon: UserCheck },
        { label: "Subscriptions", href: "/manager/subscriptions", icon: CreditCard },
        { label: "Promotions", href: "/manager/promotions", icon: Tag },
        { label: "Equipment", href: "/manager/equipment", icon: Wrench },
        { label: "Inventory", href: "/manager/inventory", icon: Package },
        { label: "Closures", href: "/manager/closures", icon: CalendarOff },
      ];
    case "admin":
      return [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Check-in", href: "/admin/checkin", icon: QrCode },
        { label: "System Alerts", href: "/admin/alerts", icon: AlertTriangle },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "ID Verification", href: "/admin/id-verification", icon: ShieldCheck },
        { label: "Activities", href: "/admin/activities", icon: Activity },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ];
    default:
      return [{ label: "Dashboard", href: "/member/dashboard", icon: LayoutDashboard }];
  }
}

export function bottomNavPrimaryItems(role: string): NavItem[] {
  return navForRole(role).slice(0, BOTTOM_NAV_PRIMARY_COUNT);
}
