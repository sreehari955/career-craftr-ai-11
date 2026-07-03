import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Bell, Briefcase, FileText, KanbanSquare, LayoutDashboard, Mail, MessagesSquare, User, LogOut, Shield, Building2 } from "lucide-react";
import { JTLogo } from "@/components/jt-logo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { unseenCount } from "@/lib/api/alerts.functions";
import { getProfile } from "@/lib/api/profile.functions";
import { getMyRoles } from "@/lib/api/jobs.functions";

const seekerNav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Find Jobs", icon: Briefcase },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/resumes", label: "Resumes", icon: FileText },
  { to: "/tracker", label: "Tracker", icon: KanbanSquare },
  { to: "/interview", label: "Interview", icon: MessagesSquare },
  { to: "/cover-letters", label: "Cover Letters", icon: Mail },
  { to: "/profile", label: "Profile", icon: User },
] as const;

const companyNav = [
  { to: "/recruiter", label: "Company", icon: Building2 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);

  const unseenFn = useServerFn(unseenCount);
  const { data: unseen = 0 } = useQuery({ queryKey: ["unseen-matches"], queryFn: () => unseenFn(), refetchInterval: 60_000 });

  const fetchProfile = useServerFn(getProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const rolesFn = useServerFn(getMyRoles);
  const { data: roles = [] } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn(), staleTime: 60_000 });
  const isCompany = profile?.account_type === "company";
  const baseNav = isCompany ? companyNav : seekerNav;
  const nav = [
    ...baseNav,
    ...(!isCompany && (roles.includes("recruiter") || roles.includes("admin")) ? [{ to: "/recruiter" as const, label: "Recruiter", icon: Building2 }] : []),
    ...(roles.includes("admin") ? [{ to: "/admin" as const, label: "Admin", icon: Shield }] : []),
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (profile.onboarded === false && pathname !== "/onboarding") {
      router.navigate({ to: "/onboarding" });
      return;
    }
    // Route company accounts to their dashboard on first landing on seeker home
    if (profile.account_type === "company" && pathname === "/dashboard") {
      router.navigate({ to: "/recruiter", replace: true });
    }
  }, [profile, pathname, router]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <Link to="/dashboard" className="flex items-center px-5 py-5">
          <JTLogo size="md" />
        </Link>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.to === "/alerts" && unseen > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">{unseen}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <Link to="/profile" className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent rounded-lg mb-2 group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="h-8 w-8 rounded-full object-cover border border-border group-hover:border-primary transition-colors duration-200" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-muted border border-border group-hover:border-primary transition-colors duration-200">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.full_name || "Set Name"}</span>
              <span className="text-[10px] text-sidebar-foreground/60 truncate">{email}</span>
            </div>
          </Link>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <Link to="/dashboard"><JTLogo size="sm" /></Link>
            <div className="flex items-center gap-2">
              <Link to="/profile" className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </Link>
              <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {nav.map((item) => (
              <Link key={item.to} to={item.to} className={cn("whitespace-nowrap rounded-full border px-3 py-1 text-xs", pathname.startsWith(item.to) ? "bg-primary text-primary-foreground" : "bg-background")}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">{children}</div>
      </main>
    </div>
  );
}
