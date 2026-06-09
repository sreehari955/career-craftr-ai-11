import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { Bell, Briefcase, FileText, KanbanSquare, LayoutDashboard, Mail, MessagesSquare, Sparkles, User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { unseenCount } from "@/lib/api/alerts.functions";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/jobs", label: "Find Jobs", icon: Briefcase },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/resumes", label: "Resumes", icon: FileText },
  { to: "/tracker", label: "Tracker", icon: KanbanSquare },
  { to: "/interview", label: "Interview", icon: MessagesSquare },
  { to: "/cover-letters", label: "Cover Letters", icon: Mail },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);

  const unseenFn = useServerFn(unseenCount);
  const { data: unseen = 0 } = useQuery({ queryKey: ["unseen-matches"], queryFn: () => unseenFn(), refetchInterval: 60_000 });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
        <Link to="/dashboard" className="flex items-center gap-2 px-5 py-5 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-hero text-primary-foreground shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          JobTrack-AI
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
          <div className="mb-2 truncate px-2 text-xs text-sidebar-foreground/60">{email}</div>
          <Button onClick={signOut} variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="font-display font-bold">JobTrack-AI</Link>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
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
