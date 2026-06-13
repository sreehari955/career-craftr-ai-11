import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, KanbanSquare, Mail, Sparkles, ArrowRight, User } from "lucide-react";
import { listResumes } from "@/lib/api/resumes.functions";
import { listApplications } from "@/lib/api/applications.functions";
import { getProfile } from "@/lib/api/profile.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const fetchResumes = useServerFn(listResumes);
  const fetchApps = useServerFn(listApplications);
  const fetchProfile = useServerFn(getProfile);

  const { data: resumes = [] } = useQuery({ queryKey: ["resumes"], queryFn: () => fetchResumes() });
  const { data: apps = [] } = useQuery({ queryKey: ["applications"], queryFn: () => fetchApps() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const byStatus = (s: string) => apps.filter((a) => a.status === s).length;

  const stats = [
    { label: "Total Applications", value: apps.length, icon: Briefcase, to: "/tracker" },
    { label: "Interviews", value: byStatus("interview"), icon: KanbanSquare, to: "/tracker" },
    { label: "Offers", value: byStatus("offer"), icon: Sparkles, to: "/tracker" },
    { label: "Rejections", value: byStatus("rejected"), icon: FileText, to: "/tracker" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="Profile" className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 shadow-soft" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-full bg-muted border-2 border-border">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-bold">
            Hi {profile?.full_name?.split(" ")[0] ?? "there"} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's a quick look at your job hunt.</p>
        </div>
      </div>

      {!profile?.onboarded && (
        <Card className="border-primary/30 bg-gradient-hero p-6 text-primary-foreground shadow-glow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Finish your profile to unlock matched jobs and AI tailoring.</p>
              <p className="text-sm text-primary-foreground/80">Takes 2 minutes.</p>
            </div>
            <Button asChild variant="secondary"><Link to="/profile">Complete profile <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="block">
            <Card className="p-5 transition hover:shadow-soft hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
                </div>
                <s.icon className="h-5 w-5 text-primary" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard to="/resumes" icon={FileText} title="Build / tailor a resume" desc="Create a master resume or generate an ATS-friendly version for a specific role." />
        <ActionCard to="/jobs" icon={Briefcase} title="Find jobs" desc="Browse internships, part-time and full-time roles matched to you." />
        <ActionCard to="/cover-letters" icon={Mail} title="Write a cover letter" desc="Generate authentic, role-tailored cover letters in seconds." />
      </div>
    </div>
  );
}

function ActionCard({ to, icon: Icon, title, desc }: { to: string; icon: typeof FileText; title: string; desc: string }) {
  return (
    <Link to={to}>
      <Card className="h-full p-5 transition hover:shadow-glow">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-hero text-primary-foreground"><Icon className="h-5 w-5" /></div>
        <h3 className="mt-4 font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </Card>
    </Link>
  );
}
