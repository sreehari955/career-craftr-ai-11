import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getResume, upsertResume } from "@/lib/api/resumes.functions";
import { scoreResumeATS, analyzeJobDescription, enhanceBullet } from "@/lib/api/ai.functions";
import { listJobs } from "@/lib/api/jobs.functions";
import {
  ArrowLeft,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
  Wand2,
  Download,
  GitBranch,
  User,
  GraduationCap,
  Briefcase,
  Code2,
  Trophy,
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Github,
  Globe,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileCheck,
  RefreshCw,
  PlusCircle,
  FilePlus2
} from "lucide-react";
import { toast } from "sonner";
import { downloadResumePdf } from "@/lib/resume-pdf";
import { buildContactLine, type ResumeContentT } from "@/lib/api/resumes.functions";
import { ResumePreview, type TemplateId } from "@/components/resume-preview";

export const Route = createFileRoute("/_authenticated/resumes/$id")({
  component: ResumeEditor,
});

const blank: ResumeContentT = {
  summary: "",
  personal: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  education: [],
  skills: [],
  skillsCategorized: {
    programmingLanguages: [],
    webTechnologies: [],
    frameworks: [],
    databases: [],
    cloudTechnologies: [],
    tools: [],
    operatingSystems: [],
    softSkills: [],
    custom: []
  },
  projects: [],
  experience: [],
  internships: [],
  certifications: [],
  certificationsFallback: [],
  achievements: {
    academic: [],
    competitions: [],
    awards: [],
    scholarships: [],
    rankings: [],
    general: []
  },
  leadership: [],
  extraCurricular: {
    clubs: [],
    volunteering: [],
    events: [],
    communityService: []
  },
  publications: [],
  languages: [],
  references: []
};

// Complete sample data matching 13 sections requested
const sampleData: ResumeContentT = {
  summary: "Ambitious and detail-oriented Computer Science undergraduate with hands-on experience in building scalable web applications. Proficient in React, Node.js, and TypeScript, with a strong foundation in data structures and algorithmic problem solving. Eager to contribute to dynamic software engineering teams.",
  personal: {
    fullName: "Siddharth Sharma",
    title: "Software Engineering Intern",
    email: "siddharth@example.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/siddharth-sharma",
    github: "github.com/siddharth-sharma",
    portfolio: "siddharth.dev",
  },
  education: [
    {
      school: "State Institute of Technology",
      degree: "Bachelor of Technology",
      branch: "Computer Science & Engineering",
      gpa: "9.2/10",
      startDate: "July 2022",
      endDate: "Expected June 2026",
      coursework: "Data Structures & Algorithms, Database Management Systems, Operating Systems, Computer Networks, Software Engineering",
      year: "2022 - 2026",
      details: "B.Tech CSE, 9.2 CGPA"
    }
  ],
  skills: ["React", "TypeScript", "Node.js", "Python", "SQL"],
  skillsCategorized: {
    programmingLanguages: ["Python", "TypeScript", "JavaScript", "Java", "C++"],
    webTechnologies: ["HTML5", "CSS3", "React", "Next.js", "Express.js"],
    frameworks: ["React Native", "Tailwind CSS", "Bootstrap"],
    databases: ["PostgreSQL", "MongoDB", "Redis"],
    cloudTechnologies: ["AWS (S3, EC2)", "Docker"],
    tools: ["Git", "GitHub", "VS Code", "Postman", "Vercel"],
    operatingSystems: ["macOS", "Linux", "Windows"],
    softSkills: ["Team Collaboration", "Problem Solving", "Agile Methodologies", "Technical Writing"],
    custom: [
      { name: "Spoken Languages", skills: ["English (Fluent)", "Hindi (Native)", "German (Conversational)"] }
    ]
  },
  projects: [
    {
      name: "Collaborative Code Editor",
      title: "Collaborative Code Editor",
      description: "A real-time collaborative workspace for developer teams to code together seamlessly.",
      tech: "React, Socket.io, Node.js, MongoDB",
      technologies: ["React", "Socket.io", "Node.js", "Express", "MongoDB"],
      features: ["Real-time code editing with multiple cursors", "Syntax highlighting for 15+ programming languages", "Embedded terminal simulator for quick code run outputs"],
      challenges: ["Resolved concurrency merge conflicts in real-time text sync by implementing Conflict-free Replicated Data Types (CRDTs)."],
      impact: ["Reduced peer-programming sync latency by 45% and onboarded 200+ student developers."],
      githubLink: "github.com/siddharth-sharma/collab-code",
      demoLink: "collabcode.dev",
      startDate: "Jan 2025",
      endDate: "Apr 2025",
      bullets: []
    },
    {
      name: "Automated ATS Engine",
      title: "Automated ATS Engine",
      description: "An AI-powered system designed to screen candidate profiles and provide tailoring recommendations.",
      tech: "FastAPI, Python, Gemini API, PostgreSQL",
      technologies: ["FastAPI", "Python", "Gemini API", "PostgreSQL", "Tailwind CSS"],
      features: ["Dynamic resume parser extracting skills and experiences", "Automated scoring based on semantic keyword mapping", "Cover letter generator tuned to job description tone"],
      challenges: ["Optimized vector embeddings lookup to search through 10,000+ developer profiles in under 120ms."],
      impact: ["Improved applicant screening efficiency, cutting recruitment evaluation time by 60%."],
      githubLink: "github.com/siddharth-sharma/ats-engine",
      demoLink: "atsengine.net",
      startDate: "Sep 2024",
      endDate: "Dec 2024",
      bullets: []
    }
  ],
  experience: [
    {
      role: "Software Developer Intern",
      company: "InnovateTech Solutions",
      type: "Internship",
      location: "Bengaluru, India",
      startDate: "May 2025",
      endDate: "Present",
      responsibilities: [
        "Architect and build responsive modular features on the client dashboard using React and TailwindCSS.",
        "Implement secure OAuth2 user validation pathways and optimize API gateway communication times.",
        "Author comprehensive component test suites in Vitest raising overall coverage from 60% to 85%."
      ],
      achievements: [
        "Optimized client bundling configurations and code splitting, yielding a 35% speedup in page loading times.",
        "Awarded 'Best Intern of the Month' for launching the collaborative document module ahead of schedule."
      ],
      technologies: ["React", "TypeScript", "Vitest", "Git"],
      period: "May 2025 - Present",
      bullets: []
    }
  ],
  internships: [
    {
      company: "WebCreations Agency",
      role: "Frontend Web Developer Intern",
      duration: "3 Months (Jun 2024 - Aug 2024)",
      responsibilities: [
        "Created custom client-facing landing pages and dashboard UI widgets for 5 active corporate clients.",
        "Translated static Figma designs into mobile-responsive, semantic code structures."
      ],
      skillsGained: ["HTML5", "CSS3", "JavaScript", "Responsive Design", "Client Relations"],
      achievements: [
        "Deployed 4 projects 100% on schedule with zero visual regressions reported."
      ]
    }
  ],
  certifications: [
    {
      name: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      issueDate: "Feb 2025",
      expiryDate: "Feb 2028",
      credentialId: "AWS-CCP-12345",
      url: "aws.amazon.com/verification"
    },
    {
      name: "Meta Frontend Developer Certificate",
      issuer: "Coursera (Meta)",
      issueDate: "Oct 2024",
      expiryDate: "",
      credentialId: "META-FE-998",
      url: "coursera.org/verify/meta-frontend"
    }
  ],
  certificationsFallback: [],
  achievements: {
    academic: ["Dean's Merit List holder for academic excellence across 6 consecutive semesters (2022-2025)."],
    competitions: ["Ranked 3rd out of 500+ competing technical teams in HackIndia Hackathon 2024."],
    awards: ["Received State Tech Council 'Young Innovator Award' 2024 for project excellence."],
    scholarships: ["Selected for the College Merit-based Academic Scholarship (covering 50% tuition fees)."],
    rankings: ["Ranked Top 1% on HackerRank Problem Solving challenges."],
    general: []
  },
  leadership: [
    {
      role: "Technical Lead",
      organization: "College Developer Club",
      duration: "Jun 2024 - May 2025",
      contributions: [
        "Directed a core software team of 15 members to design and launch the official university event board.",
        "Conducted weekly workshops covering Git workflows and React development basics, teaching over 150+ students."
      ]
    }
  ],
  extraCurricular: {
    clubs: ["Guitarist in the University Music Club; performed at 10+ inter-college cultural fests."],
    volunteering: ["Instructed basics of HTML/CSS to underprivileged high school students at CoderDojo Bengaluru."],
    events: ["Co-organized 'HackFest 2024', coordinating logistics and sponsorships for over 300 delegates."],
    communityService: ["Participated in clean-up campaigns and digital literacy seminars organized by NSS India."]
  },
  publications: [
    {
      title: "Enhancing Web Rendering Speeds through Component Code-Splitting",
      publication: "International Journal of Web Engineering (IJWE)",
      date: "Mar 2025",
      description: "Researched and compared bundler tree-shaking algorithms and React lazy load performance metrics on low-bandwidth devices.",
      url: "ijwe.org/papers/splitting"
    }
  ],
  languages: [
    { name: "English", proficiency: "Professional Work Proficiency" },
    { name: "Hindi", proficiency: "Native / Bilingual" }
  ],
  references: [
    {
      name: "Dr. Amit Roy",
      designation: "Professor & HOD, CS Department",
      organization: "State Institute of Technology",
      contact: "amitroy@sit.edu | +91-80-2345678"
    }
  ]
};

function ResumeEditor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchResume = useServerFn(getResume);
  const save = useServerFn(upsertResume);
  const score = useServerFn(scoreResumeATS);
  const fetchJobs = useServerFn(listJobs);
  const analyzeJD = useServerFn(analyzeJobDescription);
  const enhance = useServerFn(enhanceBullet);

  const { data: resume, isLoading } = useQuery({ queryKey: ["resume", id], queryFn: () => fetchResume({ data: { id } }) });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => fetchJobs() });

  const [name, setName] = useState("");
  const [isMaster, setIsMaster] = useState(false);
  const [jobId, setJobId] = useState<string>("none");
  const [content, setContent] = useState<ResumeContentT>(blank);
  const [feedback, setFeedback] = useState<Awaited<ReturnType<typeof score>> | null>(null);
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [showPreview, setShowPreview] = useState(true);
  const [jdText, setJdText] = useState("");
  const [jdAnalysis, setJdAnalysis] = useState<Awaited<ReturnType<typeof analyzeJD>> | null>(null);

  // Vertical tab state for Left pane
  const [editorTab, setEditorTab] = useState("personal");
  // Tab state for Right pane (Preview vs ATS Analyzer)
  const [rightTab, setRightTab] = useState("preview");

  useEffect(() => {
    if (resume) {
      setName(resume.name);
      setIsMaster(resume.is_master);
      setJobId(resume.job_id ?? "none");
      const c = (resume.content ?? {}) as Partial<ResumeContentT>;
      // Securely merge nested structures with fallback
      setContent({
        summary: c.summary || "",
        personal: { ...blank.personal, ...(c.personal || {}) },
        education: c.education || [],
        skills: c.skills || [],
        skillsCategorized: { ...blank.skillsCategorized, ...(c.skillsCategorized || {}) },
        projects: c.projects || [],
        experience: c.experience || [],
        internships: c.internships || [],
        certifications: c.certifications || [],
        certificationsFallback: c.certificationsFallback || [],
        achievements: { ...blank.achievements, ...(c.achievements || {}) },
        leadership: c.leadership || [],
        extraCurricular: { ...blank.extraCurricular, ...(c.extraCurricular || {}) },
        publications: c.publications || [],
        languages: c.languages || [],
        references: c.references || []
      });
      setFeedback(resume.ats_feedback as Awaited<ReturnType<typeof score>> | null);
    }
  }, [resume]);

  const contactLine = buildContactLine(content.contact);

  const saveMut = useMutation({
    mutationFn: async (updatedContent?: ResumeContentT) =>
      save({ data: { id, name, is_master: isMaster, job_id: jobId === "none" ? null : jobId, content: updatedContent || content } }),
    onSuccess: () => { toast.success("Saved successfully"); qc.invalidateQueries({ queryKey: ["resume", id] }); qc.invalidateQueries({ queryKey: ["resumes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const scoreMut = useMutation({
    mutationFn: async () => {
      await save({ data: { id, name, is_master: isMaster, job_id: jobId === "none" ? null : jobId, content } });
      return score({ data: { resume_id: id, job_id: jobId === "none" ? undefined : jobId, job_description: jdText.trim() || undefined } });
    },
    onSuccess: (data) => { setFeedback(data); toast.success(`ATS score calculated: ${data.score}/100`); qc.invalidateQueries({ queryKey: ["resumes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !resume) return <div className="p-8 text-center text-muted-foreground flex flex-col justify-center items-center h-[50vh]"><RefreshCw className="animate-spin h-8 w-8 mb-2" /> Loading resume builder…</div>;

  const updateField = <K extends keyof ResumeContentT>(k: K, v: ResumeContentT[K]) => {
    setContent((c) => ({ ...c, [k]: v }));
  };

  const updatePersonal = (f: keyof NonNullable<ResumeContentT["personal"]>, val: string) => {
    setContent((c) => ({
      ...c,
      personal: {
        ...(c.personal || {}),
        [f]: val
      }
    }));
  };

  const loadSample = () => {
    setContent(sampleData);
    toast.success("Loaded realistic sample data!");
    saveMut.mutate(sampleData);
  };

  // Helper variables for header and preview contact details
  const personal = content.personal || {};
  const contactParts = [
    personal.phone,
    personal.email,
    personal.location,
    personal.linkedin,
    personal.github,
    personal.portfolio
  ].filter(Boolean);

  // ATS CALCULATIONS
  // 1. Completeness Score
  const completenessScore = (() => {
    let score = 0;
    if (personal.fullName) score += 4;
    if (personal.email) score += 4;
    if (personal.phone) score += 4;
    if (personal.location) score += 3;
    if (content.summary) score += 10;
    if (content.education && content.education.length > 0) score += 15;

    const sc = content.skillsCategorized || {};
    const hasCategorizedSkills = (sc.programmingLanguages?.length || 0) + (sc.webTechnologies?.length || 0) + (sc.frameworks?.length || 0) > 0;
    if ((content.skills && content.skills.length > 0) || hasCategorizedSkills) score += 15;

    if (content.experience && content.experience.length > 0) score += 15;
    if (content.projects && content.projects.length > 0) score += 15;
    if (content.certifications && content.certifications.length > 0) score += 5;

    const ach = content.achievements || {};
    const hasAchievements = (ach.academic?.length || 0) + (ach.competitions?.length || 0) + (ach.awards?.length || 0) > 0;
    if (hasAchievements) score += 5;

    if ((content.leadership && content.leadership.length > 0) || (content.publications && content.publications.length > 0)) score += 5;
    return score;
  })();

  // 2. Missing Section Detection
  const missingSections: string[] = [];
  if (!content.summary) missingSections.push("Professional Summary");
  if (!content.education || content.education.length === 0) missingSections.push("Education History");
  if (!content.experience || content.experience.length === 0) missingSections.push("Work Experience");
  if (!content.projects || content.projects.length === 0) missingSections.push("Projects");

  const sc = content.skillsCategorized || {};
  const totalSkills = (sc.programmingLanguages?.length || 0) + (sc.webTechnologies?.length || 0) + (sc.frameworks?.length || 0);
  if (totalSkills === 0 && (!content.skills || content.skills.length === 0)) missingSections.push("Technical Skills");

  if (!content.certifications || content.certifications.length === 0) missingSections.push("Certifications");
  if (!content.internships || content.internships.length === 0) missingSections.push("Internship Details");
  if (!content.leadership || content.leadership.length === 0) missingSections.push("Leadership Roles");
  if (!content.publications || content.publications.length === 0) missingSections.push("Publications & Research");
  if (!content.languages || content.languages.length === 0) missingSections.push("Languages");
  if (!content.references || content.references.length === 0) missingSections.push("References");

  // 3. Bullets Heuristics & Verbs Check
  const actionVerbs = ["led", "designed", "developed", "implemented", "created", "managed", "optimized", "built", "programmed", "architected", "engineered", "launched", "authored", "wrote", "directed", "initiated", "facilitated", "formulated"];
  const allBullets: string[] = [];
  (content.experience || []).forEach(e => {
    allBullets.push(...(e.responsibilities || []), ...(e.achievements || []), ...(e.bullets || []));
  });
  (content.projects || []).forEach(p => {
    allBullets.push(...(p.features || []), ...(p.challenges || []), ...(p.impact || []), ...(p.bullets || []));
  });
  (content.internships || []).forEach(intern => {
    allBullets.push(...(intern.responsibilities || []), ...(intern.achievements || []));
  });
  (content.leadership || []).forEach(l => {
    allBullets.push(...(l.contributions || []));
  });

  const verbBullets = allBullets.filter(b => {
    const firstWord = b.trim().split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "");
    return actionVerbs.includes(firstWord || "");
  });

  const metricBullets = allBullets.filter(b => /\b\d+%?\b|\$\d+/.test(b));

  // 4. Length check
  const wordCount = JSON.stringify(content).split(/\s+/).filter(Boolean).length;
  let wordCountRating = "Ideal";
  let wordCountColor = "text-emerald-500 bg-emerald-500/10";
  if (wordCount < 150) {
    wordCountRating = "Too short (Weak)";
    wordCountColor = "text-amber-500 bg-amber-500/10";
  } else if (wordCount > 850) {
    wordCountRating = "Too long (Concise is better)";
    wordCountColor = "text-amber-500 bg-amber-500/10";
  }

  // 5. Keyword suggestions matching
  const targetKeywords = [
    "React", "TypeScript", "Python", "SQL", "Git", "Docker", "AWS", "REST API",
    "CI/CD", "Testing", "FastAPI", "MongoDB", "PostgreSQL", "Scalability", "Optimization",
    "Tailwind CSS", "Agile", "Node.js", "Collaboration", "Leader"
  ];
  const stringifiedContent = JSON.stringify(content).toLowerCase();
  const matchedKeywords = targetKeywords.filter(kw => stringifiedContent.includes(kw.toLowerCase()));
  const missingKeywords = targetKeywords.filter(kw => !stringifiedContent.includes(kw.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-9">
            <Link to="/resumes">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 w-60 font-display text-base font-semibold bg-background"
              maxLength={120}
              placeholder="Resume Name"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm mr-2 border-r pr-3 border-border">
            <Switch checked={isMaster} onCheckedChange={setIsMaster} id="master-toggle" />
            <Label htmlFor="master-toggle" className="cursor-pointer font-medium">Master</Label>
          </div>
          <Button variant="outline" size="sm" onClick={loadSample} className="h-9 text-xs">
            <FilePlus2 className="mr-1.5 h-4 w-4 text-primary" /> Load Sample Resume
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link to="/resume-history/$id" params={{ id }}>
              <GitBranch className="mr-1.5 h-4 w-4" /> History
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-9" onClick={() => downloadResumePdf(name, content)}>
            <Download className="mr-1.5 h-4 w-4" /> PDF
          </Button>
          <Button size="sm" className="bg-gradient-hero h-9" onClick={() => saveMut.mutate(undefined)}>
            <Save className="mr-1.5 h-4 w-4" /> Save Changes
          </Button>
        </div >
      </div >

    {/* TWO COLUMN BUILDER & ANALYZER */ }
    < div className = "grid gap-6 lg:grid-cols-5" >

      {/* LEFT COLUMN: EDITORS AND TABS (3/5 columns) */ }
      < div className = "lg:col-span-3 space-y-6 flex flex-col" >
        <Tabs value={editorTab} onValueChange={setEditorTab} className="w-full flex flex-col md:flex-row gap-5">
          {/* Sidebar-style steppers */}
          <TabsList className="flex flex-row md:flex-col h-auto md:w-56 shrink-0 justify-start gap-1 p-1 bg-muted/50 rounded-xl overflow-x-auto md:overflow-x-visible">
            <TabsTrigger value="personal" className="w-full justify-start py-2.5 px-3 gap-2 text-left rounded-lg transition-all text-xs font-medium">
              <User className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Personal & Summary</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="w-full justify-start py-2.5 px-3 gap-2 text-left rounded-lg transition-all text-xs font-medium">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Education & Skills</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="w-full justify-start py-2.5 px-3 gap-2 text-left rounded-lg transition-all text-xs font-medium">
              <Briefcase className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Experience & Internships</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="w-full justify-start py-2.5 px-3 gap-2 text-left rounded-lg transition-all text-xs font-medium">
              <Code2 className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Projects & Certs</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="w-full justify-start py-2.5 px-3 gap-2 text-left rounded-lg transition-all text-xs font-medium">
              <Trophy className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Achievements & Leadership</span>
            </TabsTrigger>
            <TabsTrigger value="other" className="w-full justify-start py-2.5 px-3 gap-2 text-left rounded-lg transition-all text-xs font-medium">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Activities & Publications</span>
            </TabsTrigger>
          </TabsList>

    {/* Tab content area */}
    <div className="flex-1 bg-background rounded-xl">
      {/* PERSONAL & SUMMARY */}
      <TabsContent value="personal" className="space-y-4 m-0 focus-visible:ring-0">
        <Card className="p-5 space-y-4">
          <h3 className="text-base font-bold font-display flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-primary" /> Personal Information
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs">Full Name</Label>
              <Input value={personal.fullName || ""} onChange={(e) => updatePersonal("fullName", e.target.value)} placeholder="e.g. Siddharth Sharma" maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Professional Title</Label>
              <Input value={personal.title || ""} onChange={(e) => updatePersonal("title", e.target.value)} placeholder="e.g. Software Engineer Intern" maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email Address</Label>
              <Input type="email" value={personal.email || ""} onChange={(e) => updatePersonal("email", e.target.value)} placeholder="e.g. name@example.com" maxLength={100} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone Number</Label>
              <Input value={personal.phone || ""} onChange={(e) => updatePersonal("phone", e.target.value)} placeholder="e.g. +91 98765 43210" maxLength={40} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Location</Label>
              <Input value={personal.location || ""} onChange={(e) => updatePersonal("location", e.target.value)} placeholder="e.g. Bengaluru, India" maxLength={120} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">LinkedIn URL</Label>
              <Input value={personal.linkedin || ""} onChange={(e) => updatePersonal("linkedin", e.target.value)} placeholder="linkedin.com/in/username" maxLength={200} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">GitHub URL</Label>
              <Input value={personal.github || ""} onChange={(e) => updatePersonal("github", e.target.value)} placeholder="github.com/username" maxLength={200} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs">Portfolio URL</Label>
              <Input value={personal.portfolio || ""} onChange={(e) => updatePersonal("portfolio", e.target.value)} placeholder="portfolio.dev" maxLength={200} />
            </div>
          </div>
        </Card>
        <Card className="p-5 space-y-3">
          <h3 className="text-base font-bold font-display text-foreground">Professional Summary</h3>
          <Textarea
            rows={4}
            value={content.summary}
            onChange={(e) => updateField("summary", e.target.value)}
            maxLength={2000}
            placeholder="2-3 impactful sentences outlining your core qualifications, skills, and professional objectives."
          />
        </Card>
      </TabsContent>

{/* EDUCATION & SKILLS */ }
<TabsContent value="education" className="space-y-4 m-0 focus-visible:ring-0">
  {/* EDUCATION SECTION */}
  <ListSection
    title="Education Entries"
    items={content.education || []}
    onChange={(v) => updateField("education", v)}
    blank={{ school: "", degree: "", branch: "", gpa: "", startDate: "", endDate: "", coursework: "", year: "", details: "" }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Institution Name</Label>
          <Input value={it.school} onChange={(e) => set({ ...it, school: e.target.value })} placeholder="University / School" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Degree</Label>
          <Input value={it.degree || ""} onChange={(e) => set({ ...it, degree: e.target.value })} placeholder="e.g. B.Tech / B.Sc" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Branch/Specialization</Label>
          <Input value={it.branch || ""} onChange={(e) => set({ ...it, branch: e.target.value })} placeholder="e.g. Computer Science" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CGPA/Percentage</Label>
          <Input value={it.gpa || ""} onChange={(e) => set({ ...it, gpa: e.target.value })} placeholder="e.g. 9.2/10 or 85%" maxLength={40} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Start Date</Label>
            <Input value={it.startDate || ""} onChange={(e) => set({ ...it, startDate: e.target.value })} placeholder="July 2022" maxLength={40} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">End Date</Label>
            <Input value={it.endDate || ""} onChange={(e) => set({ ...it, endDate: e.target.value })} placeholder="June 2026" maxLength={40} />
          </div>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Relevant Coursework</Label>
          <Input value={it.coursework || ""} onChange={(e) => set({ ...it, coursework: e.target.value })} placeholder="e.g. DSA, Databases, Systems" maxLength={1000} />
        </div>
      </div>
    )}
  />

  {/* TECHNICAL SKILLS SECTION */}
  <Card className="p-5 space-y-4">
    <h3 className="text-base font-bold font-display text-foreground">Technical Skills</h3>
    <p className="text-xs text-muted-foreground">Categorize your expertise so ATS keyword scanners can index it easily.</p>

    <div className="space-y-4 mt-2">
      <SkillsCategoryInput
        title="Programming Languages"
        items={content.skillsCategorized?.programmingLanguages || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), programmingLanguages: v })}
      />
      <SkillsCategoryInput
        title="Web Technologies"
        items={content.skillsCategorized?.webTechnologies || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), webTechnologies: v })}
      />
      <SkillsCategoryInput
        title="Frameworks"
        items={content.skillsCategorized?.frameworks || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), frameworks: v })}
      />
      <SkillsCategoryInput
        title="Databases"
        items={content.skillsCategorized?.databases || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), databases: v })}
      />
      <SkillsCategoryInput
        title="Cloud Technologies"
        items={content.skillsCategorized?.cloudTechnologies || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), cloudTechnologies: v })}
      />
      <SkillsCategoryInput
        title="Tools"
        items={content.skillsCategorized?.tools || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), tools: v })}
      />
      <SkillsCategoryInput
        title="Operating Systems"
        items={content.skillsCategorized?.operatingSystems || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), operatingSystems: v })}
      />
      <SkillsCategoryInput
        title="Soft Skills"
        items={content.skillsCategorized?.softSkills || []}
        onChange={(v) => updateField("skillsCategorized", { ...(content.skillsCategorized || {}), softSkills: v })}
      />

      {/* CUSTOM SKILLS CATEGORIES */}
      <div className="border-t pt-4 space-y-3">
        <Label className="text-sm font-semibold">Custom Categories</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs gap-1.5"
          onClick={() => {
            const list = content.skillsCategorized?.custom || [];
            updateField("skillsCategorized", {
              ...(content.skillsCategorized || {}),
              custom: [...list, { name: "New Category", skills: [] }]
            });
          }}
        >
          <PlusCircle className="h-4 w-4 text-primary" /> Add Custom Skills Category
        </Button>

        {(content.skillsCategorized?.custom || []).map((cat, i) => (
          <div key={i} className="border p-3 rounded-lg bg-card/50 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={cat.name}
                onChange={(e) => {
                  const list = [...(content.skillsCategorized?.custom || [])];
                  list[i] = { ...list[i], name: e.target.value };
                  updateField("skillsCategorized", { ...(content.skillsCategorized || {}), custom: list });
                }}
                className="h-8 font-semibold text-xs"
                placeholder="Category Name"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive h-8 p-2"
                onClick={() => {
                  const list = (content.skillsCategorized?.custom || []).filter((_, idx) => idx !== i);
                  updateField("skillsCategorized", { ...(content.skillsCategorized || {}), custom: list });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <SkillsCategoryInput
              title="Skills"
              items={cat.skills || []}
              onChange={(v) => {
                const list = [...(content.skillsCategorized?.custom || [])];
                list[i] = { ...list[i], skills: v };
                updateField("skillsCategorized", { ...(content.skillsCategorized || {}), custom: list });
              }}
            />
          </div>
        ))}
      </div>
    </div>
  </Card>
</TabsContent>

{/* EXPERIENCE & INTERNSHIPS */ }
<TabsContent value="experience" className="space-y-4 m-0 focus-visible:ring-0">
  {/* WORK EXPERIENCE */}
  <ListSection
    title="Work Experience"
    items={content.experience || []}
    onChange={(v) => updateField("experience", v)}
    blank={{ role: "", company: "", type: "Full-time", location: "", startDate: "", endDate: "", responsibilities: [], achievements: [], technologies: [], period: "", bullets: [] }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Job Title / Role</Label>
          <Input value={it.role} onChange={(e) => set({ ...it, role: e.target.value })} placeholder="e.g. Frontend Developer" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Company Name</Label>
          <Input value={it.company} onChange={(e) => set({ ...it, company: e.target.value })} placeholder="e.g. Google" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Employment Type</Label>
          <Select value={it.type} onValueChange={(v) => set({ ...it, type: v })}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Location</Label>
          <Input value={it.location || ""} onChange={(e) => set({ ...it, location: e.target.value })} placeholder="e.g. Bengaluru, India" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Start Date</Label>
            <Input value={it.startDate || ""} onChange={(e) => set({ ...it, startDate: e.target.value })} placeholder="May 2024" maxLength={40} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">End Date</Label>
            <Input value={it.endDate || ""} onChange={(e) => set({ ...it, endDate: e.target.value })} placeholder="Present" maxLength={40} />
          </div>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Technologies Used (comma separated)</Label>
          <Input
            value={it.technologies?.join(", ") || ""}
            onChange={(e) => set({ ...it, technologies: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="React, AWS, Node.js"
          />
        </div>
        <div className="sm:col-span-2 space-y-3 pt-2">
          <BulletListEditor
            label="Responsibilities"
            bullets={it.responsibilities || []}
            onChange={(v) => set({ ...it, responsibilities: v })}
          />
          <BulletListEditor
            label="Achievements"
            bullets={it.achievements || []}
            onChange={(v) => set({ ...it, achievements: v })}
          />
        </div>
      </div>
    )}
  />

  {/* INTERNSHIPS */}
  <ListSection
    title="Internships"
    items={content.internships || []}
    onChange={(v) => updateField("internships", v)}
    blank={{ company: "", role: "", duration: "", responsibilities: [], skillsGained: [], achievements: [] }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Company Name</Label>
          <Input value={it.company} onChange={(e) => set({ ...it, company: e.target.value })} placeholder="Company" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Role</Label>
          <Input value={it.role} onChange={(e) => set({ ...it, role: e.target.value })} placeholder="e.g. Research Intern" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duration / Period</Label>
          <Input value={it.duration || ""} onChange={(e) => set({ ...it, duration: e.target.value })} placeholder="e.g. 3 Months (Jun - Aug)" maxLength={80} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Skills Gained (comma separated)</Label>
          <Input
            value={it.skillsGained?.join(", ") || ""}
            onChange={(e) => set({ ...it, skillsGained: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
            placeholder="HTML, CSS, Git"
          />
        </div>
        <div className="sm:col-span-2 space-y-3 pt-2">
          <BulletListEditor
            label="Responsibilities"
            bullets={it.responsibilities || []}
            onChange={(v) => set({ ...it, responsibilities: v })}
          />
          <BulletListEditor
            label="Achievements"
            bullets={it.achievements || []}
            onChange={(v) => set({ ...it, achievements: v })}
          />
        </div>
      </div>
    )}
  />
</TabsContent>

{/* PROJECTS & CERTIFICATIONS */ }
<TabsContent value="projects" className="space-y-4 m-0 focus-visible:ring-0">
  {/* PROJECTS */}
  <ListSection
    title="Projects"
    items={content.projects || []}
    onChange={(v) => updateField("projects", v)}
    blank={{ name: "", title: "", description: "", tech: "", technologies: [], features: [], challenges: [], impact: [], githubLink: "", demoLink: "", startDate: "", endDate: "", bullets: [] }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Project Title</Label>
          <Input value={it.name || it.title} onChange={(e) => set({ ...it, name: e.target.value, title: e.target.value })} placeholder="Project name" maxLength={200} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Start Date</Label>
            <Input value={it.startDate || ""} onChange={(e) => set({ ...it, startDate: e.target.value })} placeholder="Jan 2025" maxLength={40} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">End Date</Label>
            <Input value={it.endDate || ""} onChange={(e) => set({ ...it, endDate: e.target.value })} placeholder="Apr 2025" maxLength={40} />
          </div>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Project Description</Label>
          <Textarea rows={2} value={it.description || ""} onChange={(e) => set({ ...it, description: e.target.value })} placeholder="A brief single-sentence summary of the project." maxLength={1500} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">GitHub Link</Label>
          <Input value={it.githubLink || ""} onChange={(e) => set({ ...it, githubLink: e.target.value })} placeholder="github.com/username/project" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Live Demo Link</Label>
          <Input value={it.demoLink || ""} onChange={(e) => set({ ...it, demoLink: e.target.value })} placeholder="project.dev" maxLength={200} />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Technologies Used (comma separated)</Label>
          <Input
            value={it.technologies?.join(", ") || it.tech || ""}
            onChange={(e) => set({ ...it, technologies: e.target.value.split(",").map(s => s.trim()).filter(Boolean), tech: e.target.value })}
            placeholder="React, Socket.io, Node.js"
          />
        </div>
        <div className="sm:col-span-2 space-y-3 pt-2">
          <BulletListEditor
            label="Key Features"
            bullets={it.features || []}
            onChange={(v) => set({ ...it, features: v })}
          />
          <BulletListEditor
            label="Challenges Solved"
            bullets={it.challenges || []}
            onChange={(v) => set({ ...it, challenges: v })}
          />
          <BulletListEditor
            label="Impact & Achievements"
            bullets={it.impact || []}
            onChange={(v) => set({ ...it, impact: v })}
          />
        </div>
      </div>
    )}
  />

  {/* CERTIFICATIONS */}
  <ListSection
    title="Certifications"
    items={content.certifications || []}
    onChange={(v) => updateField("certifications", v)}
    blank={{ name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", url: "" }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Certification Name</Label>
          <Input value={it.name} onChange={(e) => set({ ...it, name: e.target.value })} placeholder="e.g. AWS Cloud Practitioner" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Issuing Organization</Label>
          <Input value={it.issuer || ""} onChange={(e) => set({ ...it, issuer: e.target.value })} placeholder="e.g. Amazon Web Services" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Credential ID</Label>
          <Input value={it.credentialId || ""} onChange={(e) => set({ ...it, credentialId: e.target.value })} placeholder="ID string" maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Issue Date</Label>
            <Input value={it.issueDate || ""} onChange={(e) => set({ ...it, issueDate: e.target.value })} placeholder="Feb 2025" maxLength={40} />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Expiry Date</Label>
            <Input value={it.expiryDate || ""} onChange={(e) => set({ ...it, expiryDate: e.target.value })} placeholder="Feb 2028 (or Blank)" maxLength={40} />
          </div>
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Verification URL</Label>
          <Input value={it.url || ""} onChange={(e) => set({ ...it, url: e.target.value })} placeholder="Verification URL link" maxLength={200} />
        </div>
      </div>
    )}
  />
</TabsContent>

{/* ACHIEVEMENTS & LEADERSHIP */ }
<TabsContent value="achievements" className="space-y-4 m-0 focus-visible:ring-0">
  {/* CATEGORIZED ACHIEVEMENTS */}
  <Card className="p-5 space-y-4">
    <h3 className="text-base font-bold font-display text-foreground">Achievements Categories</h3>
    <div className="space-y-4">
      <BulletListEditor
        label="Academic Achievements"
        bullets={content.achievements?.academic || []}
        onChange={(v) => updateField("achievements", { ...(content.achievements || {}), academic: v })}
      />
      <BulletListEditor
        label="Competition Wins"
        bullets={content.achievements?.competitions || []}
        onChange={(v) => updateField("achievements", { ...(content.achievements || {}), competitions: v })}
      />
      <BulletListEditor
        label="Awards"
        bullets={content.achievements?.awards || []}
        onChange={(v) => updateField("achievements", { ...(content.achievements || {}), awards: v })}
      />
      <BulletListEditor
        label="Scholarships"
        bullets={content.achievements?.scholarships || []}
        onChange={(v) => updateField("achievements", { ...(content.achievements || {}), scholarships: v })}
      />
      <BulletListEditor
        label="Rankings"
        bullets={content.achievements?.rankings || []}
        onChange={(v) => updateField("achievements", { ...(content.achievements || {}), rankings: v })}
      />
    </div>
  </Card>

  {/* LEADERSHIP */}
  <ListSection
    title="Leadership & Responsibilities"
    items={content.leadership || []}
    onChange={(v) => updateField("leadership", v)}
    blank={{ role: "", organization: "", duration: "", contributions: [] }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Position Held</Label>
          <Input value={it.role} onChange={(e) => set({ ...it, role: e.target.value })} placeholder="e.g. Technical Lead" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Organization / Club</Label>
          <Input value={it.organization} onChange={(e) => set({ ...it, organization: e.target.value })} placeholder="e.g. Developer Club" maxLength={200} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duration</Label>
          <Input value={it.duration || ""} onChange={(e) => set({ ...it, duration: e.target.value })} placeholder="e.g. Jun 2024 - May 2025" maxLength={80} />
        </div>
        <div className="sm:col-span-2 space-y-2 pt-1">
          <BulletListEditor
            label="Contributions"
            bullets={it.contributions || []}
            onChange={(v) => set({ ...it, contributions: v })}
          />
        </div>
      </div>
    )}
  />
</TabsContent>

{/* OTHER SECTIONS */ }
<TabsContent value="other" className="space-y-4 m-0 focus-visible:ring-0">
  {/* EXTRA-CURRICULAR ACTIVITIES */}
  <Card className="p-5 space-y-4">
    <h3 className="text-base font-bold font-display text-foreground">Extra-Curricular Activities</h3>
    <div className="space-y-4">
      <BulletListEditor
        label="Club Activities"
        bullets={content.extraCurricular?.clubs || []}
        onChange={(v) => updateField("extraCurricular", { ...(content.extraCurricular || {}), clubs: v })}
      />
      <BulletListEditor
        label="Volunteering"
        bullets={content.extraCurricular?.volunteering || []}
        onChange={(v) => updateField("extraCurricular", { ...(content.extraCurricular || {}), volunteering: v })}
      />
      <BulletListEditor
        label="Events Organized"
        bullets={content.extraCurricular?.events || []}
        onChange={(v) => updateField("extraCurricular", { ...(content.extraCurricular || {}), events: v })}
      />
      <BulletListEditor
        label="Community Service"
        bullets={content.extraCurricular?.communityService || []}
        onChange={(v) => updateField("extraCurricular", { ...(content.extraCurricular || {}), communityService: v })}
      />
    </div>
  </Card>

  {/* PUBLICATIONS */}
  <ListSection
    title="Publications & Research"
    items={content.publications || []}
    onChange={(v) => updateField("publications", v)}
    blank={{ title: "", publication: "", date: "", description: "", url: "" }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Title</Label>
          <Input value={it.title} onChange={(e) => set({ ...it, title: e.target.value })} placeholder="Paper title" maxLength={300} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Publication / Journal / Conference</Label>
          <Input value={it.publication || ""} onChange={(e) => set({ ...it, publication: e.target.value })} placeholder="e.g. IEEE Conference" maxLength={300} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date</Label>
          <Input value={it.date || ""} onChange={(e) => set({ ...it, date: e.target.value })} placeholder="e.g. March 2025" maxLength={40} />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Description</Label>
          <Textarea rows={2} value={it.description || ""} onChange={(e) => set({ ...it, description: e.target.value })} placeholder="Paper abstract or short summary..." maxLength={1000} />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-xs">Publication URL</Label>
          <Input value={it.url || ""} onChange={(e) => set({ ...it, url: e.target.value })} placeholder="e.g. dx.doi.org/..." maxLength={200} />
        </div>
      </div>
    )}
  />

  {/* LANGUAGES */}
  <ListSection
    title="Languages"
    items={content.languages || []}
    onChange={(v) => updateField("languages", v)}
    blank={{ name: "", proficiency: "" }}
    render={(it, set) => (
      <div className="grid gap-3 grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Language Name</Label>
          <Input value={it.name} onChange={(e) => set({ ...it, name: e.target.value })} placeholder="e.g. English" maxLength={60} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Proficiency Level</Label>
          <Input value={it.proficiency || ""} onChange={(e) => set({ ...it, proficiency: e.target.value })} placeholder="e.g. Fluent / Native" maxLength={60} />
        </div>
      </div>
    )}
  />

  {/* REFERENCES */}
  <ListSection
    title="References (Optional)"
    items={content.references || []}
    onChange={(v) => updateField("references", v)}
    blank={{ name: "", designation: "", organization: "", contact: "" }}
    render={(it, set) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input value={it.name} onChange={(e) => set({ ...it, name: e.target.value })} placeholder="Reference Full Name" maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Designation</Label>
          <Input value={it.designation || ""} onChange={(e) => set({ ...it, designation: e.target.value })} placeholder="e.g. Principal Scientist" maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Organization</Label>
          <Input value={it.organization || ""} onChange={(e) => set({ ...it, organization: e.target.value })} placeholder="e.g. Tech Corp" maxLength={120} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Contact Details</Label>
          <Input value={it.contact || ""} onChange={(e) => set({ ...it, contact: e.target.value })} placeholder="e.g. email@domain.com or phone" maxLength={200} />
        </div>
      </div>
    )}
  />
</TabsContent>
            </div >
          </Tabs >
        </div >

  {/* RIGHT COLUMN: PREVIEW AND ATS STATS PANEL (2/5 columns) */ }
  < div className = "lg:col-span-2 space-y-5" >
    <Tabs value={rightTab} onValueChange={setRightTab} className="w-full bg-card rounded-xl border p-4 shadow-soft">
      <TabsList className="grid grid-cols-2 w-full mb-4">
        <TabsTrigger value="preview" className="text-xs gap-1.5 py-2">
          <FileText className="h-4 w-4" /> Live Preview
        </TabsTrigger>
        <TabsTrigger value="ats" className="text-xs gap-1.5 py-2">
          <FileCheck className="h-4 w-4" /> ATS Optimization
        </TabsTrigger>
      </TabsList>

      {/* PREVIEW TAB */}
      <TabsContent value="preview" className="m-0 focus-visible:ring-0">
        <div className="flex items-center justify-between border-b pb-2 mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">A4 Print Simulator</span>
          <Badge variant="outline" className="text-[10px] text-primary bg-primary/5">Standard Layout</Badge>
        </div>
        <ScrollArea className="h-[600px] border rounded-lg bg-slate-100 p-4">
          {/* HTML ATS Resume Canvas Mock */}
          <div className="bg-white text-black p-6 font-sans shadow-md mx-auto text-[9px] leading-relaxed select-text min-h-[780px]">
            {/* Personal Header */}
            <div className="text-center mb-3">
              <h2 className="text-base font-bold uppercase tracking-wide">{personal.fullName || name || "Candidate Name"}</h2>
              {personal.title && <p className="text-[10px] text-slate-700 font-semibold mt-0.5">{personal.title}</p>}
              {contactParts.length > 0 ? (
                <p className="text-[8px] text-slate-600 mt-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                  {contactParts.map((p, index) => (
                    <span key={index} className="inline-flex items-center">
                      {p}
                      {index < contactParts.length - 1 && <span className="mx-1 text-slate-300">|</span>}
                    </span>
                  ))}
                </p>
              ) : null}
            </div>

            {/* Summary */}
            {content.summary ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Summary</h4>
                <p className="text-[8px] text-slate-800 leading-normal">{content.summary}</p>
              </div>
            ) : null}

            {/* Experience */}
            {content.experience && content.experience.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Work Experience</h4>
                {content.experience.map((e, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="flex justify-between font-semibold">
                      <span>{e.role}{e.company ? ` · ${e.company}` : ""}{e.type ? ` (${e.type})` : ""}</span>
                      <span className="text-[8px] text-slate-600">{e.startDate} – {e.endDate}</span>
                    </div>
                    {e.location && <div className="text-[8px] text-slate-500 italic">{e.location}</div>}
                    {e.technologies && e.technologies.length > 0 && (
                      <div className="text-[7.5px] text-slate-600 mt-0.5 font-medium italic">Technologies: {e.technologies.join(", ")}</div>
                    )}
                    <ul className="list-disc pl-3.5 mt-0.5 space-y-0.5">
                      {[...(e.responsibilities || []), ...(e.achievements || []), ...(e.bullets || [])].filter(Boolean).map((b, bi) => (
                        <li key={bi} className="text-[8px] text-slate-800">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Internships */}
            {content.internships && content.internships.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Internships</h4>
                {content.internships.map((intern, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="flex justify-between font-semibold">
                      <span>{intern.role} · {intern.company}</span>
                      <span className="text-[8px] text-slate-600">{intern.duration}</span>
                    </div>
                    {intern.skillsGained && intern.skillsGained.length > 0 && (
                      <div className="text-[7.5px] text-slate-600 mt-0.5 font-medium italic">Skills: {intern.skillsGained.join(", ")}</div>
                    )}
                    <ul className="list-disc pl-3.5 mt-0.5 space-y-0.5">
                      {[...(intern.responsibilities || []), ...(intern.achievements || [])].filter(Boolean).map((b, bi) => (
                        <li key={bi} className="text-[8px] text-slate-800">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Projects */}
            {content.projects && content.projects.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Projects</h4>
                {content.projects.map((p, index) => (
                  <div key={index} className="mb-2 last:mb-0">
                    <div className="flex justify-between font-semibold">
                      <span>{p.name || p.title}</span>
                      <span className="text-[8px] text-slate-600">{p.startDate} – {p.endDate}</span>
                    </div>
                    <div className="flex justify-between text-[7.5px] text-slate-600 mt-0.5">
                      <span className="italic font-medium">Technologies: {p.technologies?.join(", ") || p.tech}</span>
                      <span>
                        {[p.githubLink ? `GH: ${p.githubLink}` : "", p.demoLink ? `Demo: ${p.demoLink}` : ""].filter(Boolean).join(" | ")}
                      </span>
                    </div>
                    {p.description && <p className="text-[8px] text-slate-700 leading-relaxed mt-0.5">{p.description}</p>}
                    <ul className="list-disc pl-3.5 mt-0.5 space-y-0.5">
                      {[...(p.features || []).map(x => `Feature: ${x}`), ...(p.challenges || []).map(x => `Challenge: ${x}`), ...(p.impact || []).map(x => `Impact: ${x}`), ...(p.bullets || [])].filter(Boolean).map((b, bi) => (
                        <li key={bi} className="text-[8px] text-slate-800">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Education */}
            {content.education && content.education.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Education</h4>
                {content.education.map((e, index) => (
                  <div key={index} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between font-semibold">
                      <span>{e.school}</span>
                      <span className="text-[8px] text-slate-600">{e.startDate} – {e.endDate}</span>
                    </div>
                    <div className="text-[8px] text-slate-700">
                      {[e.degree, e.branch, e.gpa ? `CGPA: ${e.gpa}` : "", e.details].filter(Boolean).join(" · ")}
                    </div>
                    {e.coursework && <div className="text-[7.5px] text-slate-500 mt-0.5">Coursework: {e.coursework}</div>}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Skills */}
            {matchedKeywords.length > 0 || (content.skills && content.skills.length > 0) ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Technical Skills</h4>
                {(() => {
                  const sc = content.skillsCategorized || {};
                  const skillsArr = [
                    { l: "Programming", i: sc.programmingLanguages },
                    { l: "Web", i: sc.webTechnologies },
                    { l: "Frameworks", i: sc.frameworks },
                    { l: "Databases", i: sc.databases },
                    { l: "Cloud", i: sc.cloudTechnologies },
                    { l: "Tools", i: sc.tools },
                    { l: "OS", i: sc.operatingSystems },
                    { l: "Soft Skills", i: sc.softSkills },
                    ...(sc.custom || []).map((c: any) => ({ l: c.name, i: c.skills }))
                  ].filter(x => x.i && x.i.length > 0);

                  if (skillsArr.length > 0) {
                    return (
                      <div className="space-y-0.5">
                        {skillsArr.map((s, idx) => (
                          <div key={idx} className="text-[8px] text-slate-800">
                            <span className="font-semibold">{s.l}:</span> {s.i?.join(", ")}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <p className="text-[8px] text-slate-800">{(content.skills || []).join(" · ")}</p>;
                })()}
              </div>
            ) : null}

            {/* Certifications */}
            {content.certifications && content.certifications.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Certifications</h4>
                {content.certifications.map((c: any, index) => {
                  if (typeof c === "string") {
                    return <div key={index} className="text-[8px] text-slate-800">• {c}</div>;
                  }
                  return (
                    <div key={index} className="mb-1 last:mb-0">
                      <div className="flex justify-between font-semibold">
                        <span>{c.name} {c.issuer ? `· ${c.issuer}` : ""}</span>
                        <span className="text-[8px] text-slate-600">{[c.issueDate, c.expiryDate].filter(Boolean).join(" – ")}</span>
                      </div>
                      {(c.credentialId || c.url) && (
                        <div className="text-[7.5px] text-slate-500">
                          {[c.credentialId ? `ID: ${c.credentialId}` : "", c.url ? `Link: ${c.url}` : ""].filter(Boolean).join(" | ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Achievements */}
            {(() => {
              const ach = content.achievements || {};
              const items = [
                ...(ach.academic || []).map(x => `[Academic] ${x}`),
                ...(ach.competitions || []).map(x => `[Competition] ${x}`),
                ...(ach.awards || []).map(x => `[Award] ${x}`),
                ...(ach.scholarships || []).map(x => `[Scholarship] ${x}`),
                ...(ach.rankings || []).map(x => `[Ranking] ${x}`),
                ...(ach.general || [])
              ].filter(Boolean);
              if (items.length === 0) return null;
              return (
                <div className="mb-2.5">
                  <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Achievements</h4>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    {items.map((it, idx) => <li key={idx} className="text-[8px] text-slate-800">{it}</li>)}
                  </ul>
                </div>
              );
            })()}

            {/* Leadership */}
            {content.leadership && content.leadership.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Leadership</h4>
                {content.leadership.map((l, index) => (
                  <div key={index} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between font-semibold">
                      <span>{l.role} · {l.organization}</span>
                      <span className="text-[8px] text-slate-600">{l.duration}</span>
                    </div>
                    <ul className="list-disc pl-3.5 space-y-0.5">
                      {(l.contributions || []).filter(Boolean).map((b, bi) => (
                        <li key={bi} className="text-[8px] text-slate-800">{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Extra-curricular */}
            {(() => {
              const ec = content.extraCurricular || {};
              const items = [
                ...(ec.clubs || []).map(x => `[Club] ${x}`),
                ...(ec.volunteering || []).map(x => `[Volunteering] ${x}`),
                ...(ec.events || []).map(x => `[Event] ${x}`),
                ...(ec.communityService || []).map(x => `[Community Service] ${x}`)
              ].filter(Boolean);
              if (items.length === 0) return null;
              return (
                <div className="mb-2.5">
                  <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Activities & Volunteering</h4>
                  <ul className="list-disc pl-3.5 space-y-0.5">
                    {items.map((it, idx) => <li key={idx} className="text-[8px] text-slate-800">{it}</li>)}
                  </ul>
                </div>
              );
            })()}

            {/* Publications */}
            {content.publications && content.publications.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Publications</h4>
                {content.publications.map((pub, index) => (
                  <div key={index} className="mb-1.5 last:mb-0">
                    <div className="flex justify-between font-semibold">
                      <span>{pub.title}{pub.publication ? ` · ${pub.publication}` : ""}</span>
                      <span className="text-[8px] text-slate-600">{pub.date}</span>
                    </div>
                    {pub.description && <p className="text-[8px] text-slate-700 leading-normal mt-0.5">{pub.description}</p>}
                    {pub.url && <div className="text-[7.5px] text-blue-600 font-medium">{pub.url}</div>}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Languages */}
            {content.languages && content.languages.length > 0 ? (
              <div className="mb-2.5">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">Languages</h4>
                <p className="text-[8px] text-slate-800">
                  {content.languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ""}`).join("   ·   ")}
                </p>
              </div>
            ) : null}

            {/* References */}
            {content.references && content.references.length > 0 ? (
              <div className="mb-2">
                <h4 className="text-[9.5px] font-bold uppercase border-b border-slate-700 pb-0.5 mb-1 tracking-wider">References</h4>
                <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-800">
                  {content.references.map((r, index) => (
                    <div key={index} className="border-l border-slate-300 pl-2">
                      <span className="font-semibold">{r.name}</span>
                      <div className="text-[7.5px] text-slate-600">{[r.designation, r.organization].filter(Boolean).join(", ")}</div>
                      <div className="text-[7.5px] text-slate-500 mt-0.5">{r.contact}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </TabsContent>

      {/* ATS ANALYZER TAB */}
      <TabsContent value="ats" className="m-0 focus-visible:ring-0 space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Scorecard</span>
          <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500 bg-emerald-500/5">Interactive Rules</Badge>
        </div>

        {/* Completeness Gauge */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-soft">
          <div className="space-y-1">
            <span className="text-xs font-bold text-muted-foreground block">Completeness Score</span>
            <span className="text-2xl font-black font-display tracking-tight text-gradient">{completenessScore}%</span>
            <span className="text-[10px] text-muted-foreground block">Based on resume structure sections</span>
          </div>
          <div className="w-20">
            <Progress value={completenessScore} className="h-2 bg-slate-200" />
          </div>
        </div>

        {/* missing fields check */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold block">Missing Sections Detection ({missingSections.length})</Label>
          {missingSections.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {missingSections.map((sec) => (
                <Badge key={sec} variant="destructive" className="bg-destructive/15 text-destructive border-destructive/20 text-[10px] font-medium gap-1 py-0.5">
                  <AlertCircle className="h-3 w-3" /> Missing {sec}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0" /> Ideal setup! All major sections filled.</div>
          )}
        </div>

        {/* Bullet points action verbs check */}
        <div className="p-3 border rounded-lg space-y-2 bg-card">
          <Label className="text-xs font-semibold flex justify-between">
            <span>Action Verbs Detection</span>
            <span className="text-[10px] text-muted-foreground">{verbBullets.length} / {allBullets.length} bullets</span>
          </Label>
          <div className="text-[10.5px] text-muted-foreground leading-relaxed">
            ATS parses prioritize achievement-oriented bullets. We found that <span className="font-semibold text-foreground">{verbBullets.length}</span> of your <span className="font-semibold">{allBullets.length}</span> description bullets start with recognized strong verbs (e.g. <i>Led, Developed, Optimized</i>).
          </div>
          <Progress value={allBullets.length > 0 ? (verbBullets.length / allBullets.length) * 100 : 0} className="h-1.5" />
        </div>

        {/* Quantifiable impact check */}
        <div className="p-3 border rounded-lg space-y-2 bg-card">
          <Label className="text-xs font-semibold flex justify-between">
            <span>Quantitative Impact Detection</span>
            <span className="text-[10px] text-muted-foreground">{metricBullets.length} / {allBullets.length} bullets</span>
          </Label>
          <div className="text-[10.5px] text-muted-foreground leading-relaxed">
            Adding metrics (e.g. <i>40% speedup, 10+ clients, $5K budget</i>) elevates resume quality score. We detected numbers/metrics in <span className="font-semibold text-foreground">{metricBullets.length}</span> of your bullets.
          </div>
          <Progress value={allBullets.length > 0 ? (metricBullets.length / allBullets.length) * 100 : 0} className="h-1.5" />
        </div>

        {/* Word Count check */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border rounded-lg text-center bg-card">
            <span className="text-[10px] text-muted-foreground block font-medium">Word Count</span>
            <span className="text-base font-bold block mt-0.5">{wordCount} words</span>
            <Badge className={`mt-1.5 text-[9px] hover:bg-transparent capitalize ${wordCountColor}`}>{wordCountRating}</Badge>
          </div>
          <div className="p-3 border rounded-lg text-center bg-card">
            <span className="text-[10px] text-muted-foreground block font-medium">Contact Links</span>
            <div className="flex justify-center gap-1 mt-1">
              <Badge variant={personal.linkedin ? "default" : "outline"} className="text-[9px] scale-90">LinkedIn</Badge>
              <Badge variant={personal.github ? "default" : "outline"} className="text-[9px] scale-90">GitHub</Badge>
            </div>
            <span className="text-[9px] text-muted-foreground block mt-1">
              {[personal.linkedin, personal.github].filter(Boolean).length} / 2 present
            </span>
          </div>
        </div>

        {/* Keyword optimization */}
        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs font-semibold block">Industry Keywords Check</Label>
          <div className="flex flex-wrap gap-1.5">
            {matchedKeywords.map(k => <Badge key={k} variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">{k} ✓</Badge>)}
            {missingKeywords.slice(0, 8).map(k => <Badge key={k} variant="outline" className="text-[10px] text-muted-foreground">{k}</Badge>)}
          </div>
          <p className="text-[9px] text-muted-foreground italic">Top 20 software index check. Incorporate unmatched keywords organically.</p>
        </div>

        {/* AI ATS Check Module */}
        <div className="border-t pt-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground flex items-center gap-1">
              <Sparkles className="h-4 w-4 text-primary" /> AI Semantic Review
            </Label>
            <Button size="sm" variant="outline" onClick={() => scoreMut.mutate()} disabled={scoreMut.isPending} className="h-7 text-xs bg-primary/5 text-primary border-primary/20">
              <Wand2 className="mr-1 h-3.5 w-3.5" /> {scoreMut.isPending ? "Analyzing..." : "Run AI Review"}
            </Button>
          </div>

          {feedback && (
            <div className="p-3 rounded-lg bg-slate-50 border space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-display">{feedback.score}</span>
                <span className="text-[10px] text-muted-foreground">/ 100 Semantic Match</span>
              </div>
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold block text-slate-700">AI Suggestions:</span>
                  <ul className="text-[10px] text-slate-600 space-y-1 list-disc pl-3">
                    {feedback.suggestions.slice(0, 4).map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
        </div >
      </div >
    </div >
  );
}

// Sub-component: Form list section layout (allows multiple entries with delete/add)
function ListSection<T>({
  title,
  items,
  onChange,
  blank,
  render
}: {
  title: string;
  items: T[];
  onChange: (v: T[]) => void;
  blank: T;
  render: (it: T, set: (v: T) => void) => React.ReactNode;
}) {
  return (
    <Card className="p-5 space-y-3">
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <h3 className="text-base font-bold font-display text-foreground">{title}</h3>
        <Button size="sm" variant="ghost" className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/5 text-xs font-semibold" onClick={() => onChange([...items, { ...blank }])}>
          <Plus className="h-4 w-4" /> Add Entry
        </Button>
      </div>
  {
    items.length === 0 ? (
      <div className="text-xs text-center py-6 text-muted-foreground italic border border-dashed rounded-lg bg-muted/20">No entries added. Click 'Add Entry' above to start.</div>
    ) : (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={i} className="relative space-y-3 rounded-xl border p-4 bg-muted/10">
          <div className="absolute top-2 right-2 z-10">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
                      </div>
                      <div className="pr-8">
                        {render(it, (v) => onChange(items.map((x, j) => j === i ? v : x)))}
                      </div>
                    </div>
                  ))}
              </div>
      )}
            </Card>
            );
}

            // Sub-component: Dynamic Bullet Points Editor
            function BulletListEditor({label, bullets, onChange}: {label: string; bullets: string[]; onChange: (v: string[]) => void }) {
  const [val, setVal] = useState("");
  const add = () => {
    if (!val.trim()) return;
            onChange([...bullets, val.trim()]);
            setVal("");
  };
            return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
                <span className="text-[10px] text-muted-foreground font-medium">{bullets.length} bullets</span>
              </div>
              <div className="flex gap-2">
                <Input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder={`Add bullet details...`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={add} className="h-8 text-xs px-2.5">Add</Button>
              </div>
              {bullets.length > 0 && (
                <ul className="space-y-1 max-h-36 overflow-y-auto rounded-lg border p-2 bg-muted/10">
                  {bullets.map((b, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 text-[10.5px] border-b border-border/50 pb-1.5 pt-0.5 last:border-0 last:pb-0">
                      <span className="flex-1 text-slate-700 leading-normal"><span className="text-primary font-bold mr-1">•</span> {b}</span>
                      <button type="button" onClick={() => onChange(bullets.filter((_, j) => j !== i))} className="text-destructive hover:text-destructive/80 p-0.5">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            );
}

            // Sub-component: Dynamic Tag Pill Input (used for technical skills categories)
            const SKILL_EXAMPLES: Record<string, string> = {
              "Programming Languages": "Python",
              "Web Technologies": "HTML5, CSS3, REST APIs",
              "Frameworks": "React, Next.js, Django",
              "Databases": "PostgreSQL, MongoDB",
              "Cloud Technologies": "AWS, GCP, Azure",
              "Tools": "Git, Docker, Jira",
              "Operating Systems": "Linux, Windows, macOS",
              "Soft Skills": "Communication, Leadership",
              "Skills": "Add a skill",
            };
            function SkillsCategoryInput({title, items, onChange}: {title: string; items: string[]; onChange: (v: string[]) => void }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
            if (!t) return;
            if (!items.includes(t)) onChange([...items, t]);
            setVal("");
  };
            const example = SKILL_EXAMPLES[title] || "Add a skill";
            return (
            <div className="space-y-2 rounded-lg border p-3 bg-card shadow-xs">
              <Label className="text-xs font-semibold text-foreground/80">{title}</Label>
              <div className="flex gap-2">
                <Input
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder={`e.g. ${example}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      add();
                    }
                  }}
                  className="h-8 text-xs"
                />
                <Button type="button" variant="outline" size="sm" onClick={add} className="h-8 text-xs">Add</Button>
              </div>
              {items.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {items.map((it) => (
                    <Badge key={it} variant="secondary" className="gap-1 text-[10px] font-medium py-0.5 px-2">
                      {it}
                      <button type="button" onClick={() => onChange(items.filter(x => x !== it))} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            );
}
