import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getProfile, updateProfile } from "@/lib/api/profile.functions";
import { toast } from "sonner";
import { X, Camera, User, Trash } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

function ProfilePage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getProfile);
  const saveProfile = useServerFn(updateProfile);
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const router = useRouter();
  const [form, setForm] = useState<Partial<Profile>>({});
  
  // Cropper / Adjustment states
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (data) {
      const localAvatar = data.id ? localStorage.getItem(`avatar_${data.id}`) : null;
      setForm({
        ...data,
        avatar_url: data.avatar_url || localAvatar
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: async (vals: Partial<Profile>) => {
      // Save avatar to localStorage as a robust local fallback
      if (vals.id) {
        if (vals.avatar_url) {
          localStorage.setItem(`avatar_${vals.id}`, vals.avatar_url);
        } else {
          localStorage.removeItem(`avatar_${vals.id}`);
        }
      }

      try {
        // Try to update with avatar_url
        return await saveProfile({ data: { ...vals, onboarded: true } as never });
      } catch (err: any) {
        // If it failed because of avatar_url column missing, retry without it
        if (err.message?.includes("avatar_url") || err.message?.includes("schema cache") || err.message?.includes("column")) {
          const { avatar_url, ...rest } = vals;
          return await saveProfile({ data: { ...rest, onboarded: true } as never });
        }
        throw err;
      }
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };
  
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const applyCrop = () => {
    const img = new Image();
    img.src = cropImage!;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const canvasSize = 300;
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasSize, canvasSize);

      ctx.translate(canvasSize / 2, canvasSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const ratio = img.width / img.height;
      const scaleFactor = canvasSize / 200; 

      const drawW = canvasSize;
      const drawH = canvasSize / ratio;

      ctx.drawImage(
        img,
        -drawW / 2 + pan.x * scaleFactor,
        -drawH / 2 + pan.y * scaleFactor,
        drawW * zoom,
        drawH * zoom
      );

      const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      set("avatar_url", croppedDataUrl);
      setCropImage(null);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImage(reader.result as string);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <p>Loading…</p>;

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Your profile</h1>
        <p className="mt-1 text-muted-foreground">The more we know, the better we can match jobs and tailor resumes.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Basics</h2>
        
        {/* Profile Photo Upload Section */}
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6 border-b pb-6 border-muted/50">
          <div className="relative group h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted flex items-center justify-center transition-all duration-300 hover:border-primary shadow-soft">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt="Profile preview" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-muted-foreground" />
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white transition-opacity duration-200 text-xs gap-1">
              <Camera className="h-5 w-5" />
              <span>Change</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <div className="flex flex-col justify-center items-center sm:items-start gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="relative cursor-pointer"
                asChild
              >
                <label>
                  <Camera className="mr-2 h-4 w-4" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </Button>
              {form.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => set("avatar_url", null)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center sm:text-left">
              JPG, PNG or WEBP. Max size 2MB.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name"><Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} maxLength={120} /></Field>
          <Field label="Headline (e.g. CS undergrad · React + Python)"><Input value={form.headline ?? ""} onChange={(e) => set("headline", e.target.value)} maxLength={200} /></Field>
          <Field label="Location"><Input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} maxLength={120} /></Field>
          <Field label="Phone"><Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} maxLength={40} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Education</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="College / University"><Input value={form.college ?? ""} onChange={(e) => set("college", e.target.value)} maxLength={200} /></Field>
          <Field label="Degree (e.g. B.Tech CSE)"><Input value={form.degree ?? ""} onChange={(e) => set("degree", e.target.value)} maxLength={120} /></Field>
          <Field label="Graduation year"><Input type="number" min={1950} max={2100} value={form.graduation_year ?? ""} onChange={(e) => set("graduation_year", e.target.value ? Number(e.target.value) : null)} /></Field>
          <Field label="CGPA (optional)"><Input type="number" step="0.01" min={0} max={10} value={form.cgpa ?? ""} onChange={(e) => set("cgpa", e.target.value ? Number(e.target.value) : null)} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Skills & preferences</h2>
        <div className="space-y-4">
          <TagInput label="Skills" placeholder="React, Python, SQL…" value={form.skills ?? []} onChange={(v) => set("skills", v)} />
          <TagInput label="Preferred roles" placeholder="Frontend Intern, Data Analyst…" value={form.preferred_roles ?? []} onChange={(v) => set("preferred_roles", v)} />
          <TagInput label="Preferred locations" placeholder="Remote, Bengaluru, Kochi…" value={form.preferred_locations ?? []} onChange={(v) => set("preferred_locations", v)} />
          <div>
            <Label className="mb-2 block text-sm">What are you mainly looking for?</Label>
            <div className="flex flex-wrap gap-2">
              {["Internship", "Part-time", "Full-time / Graduate role", "Remote only"].map((g) => {
                const active = (form.goals ?? []).includes(g);
                return (
                  <button
                    key={g} type="button"
                    onClick={() => set("goals", active ? (form.goals ?? []).filter((x) => x !== g) : [...(form.goals ?? []), g])}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}
                  >{g}</button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Links</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="GitHub"><Input value={form.github_url ?? ""} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/…" /></Field>
          <Field label="LinkedIn"><Input value={form.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/…" /></Field>
          <Field label="Portfolio"><Input value={form.portfolio_url ?? ""} onChange={(e) => set("portfolio_url", e.target.value)} placeholder="https://…" /></Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => mut.mutate(form)} disabled={mut.isPending} className="bg-gradient-hero">
          {mut.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>

      {/* Crop & Adjust Modal */}
      {cropImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border rounded-2xl p-6 shadow-glow border-muted/50 animate-zoom-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-display">Crop & Adjust Photo</h3>
              <button type="button" onClick={() => setCropImage(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Viewport */}
            <div 
              className="relative h-60 w-full bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center border cursor-move select-none mb-6 group-hover:border-primary/50 transition-colors"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Circular Mask Overlay */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none z-10 flex items-center justify-center">
                <div className="h-[200px] w-[200px] rounded-full border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"></div>
              </div>

              {/* Ajustable Image */}
              <img
                src={cropImage}
                alt="Adjust preview"
                draggable={false}
                className="absolute max-w-none origin-center pointer-events-none select-none transition-transform duration-75"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  width: "200px",
                  height: "auto",
                }}
              />
            </div>

            {/* Adjust Controls */}
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-muted-foreground">Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-medium text-muted-foreground">Rotate</span>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => (r - 90) % 360)}
                    className="h-8 text-xs"
                  >
                    Rotate Left
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="h-8 text-xs"
                  >
                    Rotate Right
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => setCropImage(null)} className="h-9 text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={applyCrop} className="bg-gradient-hero h-9 text-xs">
                Apply Photo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}

function TagInput({ label, placeholder, value, onChange }: { label: string; placeholder?: string; value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setInput("");
  };
  return (
    <div>
      <Label className="mb-2 block text-sm">{label}</Label>
      <div className="flex gap-2">
        <Input value={input} placeholder={placeholder} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }} maxLength={60} />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1">
              {t}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
