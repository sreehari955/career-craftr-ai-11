import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getSession, saveAnswer, scoreAnswer } from "@/lib/api/interview.functions";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mic, Square, Sparkles, Play } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/interview/$id")({
  component: InterviewSessionPage,
});

type Q = { question: string; type: string; hint: string };
type Ans = { text: string; audio_path: string | null };
type Fb = { score: number; strengths: string[]; improvements: string[]; ideal_answer: string } | null;

function InterviewSessionPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchSession = useServerFn(getSession);
  const save = useServerFn(saveAnswer);
  const scoreFn = useServerFn(scoreAnswer);

  const { data: session, isLoading } = useQuery({ queryKey: ["interview-session", id], queryFn: () => fetchSession({ data: { id } }) });

  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const questions: Q[] = (session?.questions as Q[] | undefined) ?? [];
  const answers: Ans[] = (session?.answers as Ans[] | undefined) ?? [];
  const feedback: Fb[] = (session?.feedback as Fb[] | undefined) ?? [];
  const current = questions[idx];
  const currentFb = feedback[idx];

  useEffect(() => {
    const a = answers[idx];
    setText(a?.text ?? "");
    setAudioPath(a?.audio_path ?? null);
    setAudioUrl(null);
    if (a?.audio_path) {
      supabase.storage.from("interview-audio").createSignedUrl(a.audio_path, 3600).then(({ data }) => {
        if (data?.signedUrl) setAudioUrl(data.signedUrl);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, session?.id]);

  const saveMut = useMutation({
    mutationFn: async () => save({ data: { session_id: id, question_index: idx, text, audio_path: audioPath } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["interview-session", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const scoreMut = useMutation({
    mutationFn: async () => {
      if (text.trim().length < 5) throw new Error("Type your answer first");
      await save({ data: { session_id: id, question_index: idx, text, audio_path: audioPath } });
      return scoreFn({ data: { session_id: id, question_index: idx, answer_text: text } });
    },
    onSuccess: () => { toast.success("Feedback ready"); qc.invalidateQueries({ queryKey: ["interview-session", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const path = `${user.id}/${id}/${idx}-${Date.now()}.webm`;
        const { error } = await supabase.storage.from("interview-audio").upload(path, blob, { upsert: true, contentType: "audio/webm" });
        if (error) { toast.error(error.message); return; }
        setAudioPath(path);
        const { data: signed } = await supabase.storage.from("interview-audio").createSignedUrl(path, 3600);
        setAudioUrl(signed?.signedUrl ?? null);
        await save({ data: { session_id: id, question_index: idx, text, audio_path: path } });
        toast.success("Recording saved");
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  if (isLoading || !session) return <p>Loading session…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm"><Link to="/interview"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
        <h1 className="font-display text-2xl font-bold">{session.title}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <Card className="p-3">
          <h3 className="px-2 text-xs font-semibold uppercase text-muted-foreground">Questions</h3>
          <div className="mt-2 space-y-1">
            {questions.map((q, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-full rounded-md px-2 py-2 text-left text-sm ${i === idx ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Q{i + 1}</span>
                  {feedback[i] && <Badge variant={i === idx ? "secondary" : "default"} className="h-5">{feedback[i]?.score}</Badge>}
                </div>
                <p className="line-clamp-2 text-xs opacity-80">{q.question}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          {current && (
            <Card className="p-5">
              <Badge variant="outline" className="capitalize">{current.type}</Badge>
              <h2 className="mt-2 font-display text-lg font-semibold">{current.question}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Hint: {current.hint}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {!recording ? (
                  <Button size="sm" variant="outline" onClick={startRecording}><Mic className="mr-1 h-4 w-4" /> Record answer</Button>
                ) : (
                  <Button size="sm" variant="destructive" onClick={stopRecording}><Square className="mr-1 h-4 w-4" /> Stop</Button>
                )}
                {audioUrl && (
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <audio controls src={audioUrl} className="h-8" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium">Your answer (type or transcribe)</label>
                <Textarea className="mt-2" rows={6} value={text} onChange={(e) => setText(e.target.value)} maxLength={8000} placeholder="Write your answer. Use STAR for behavioral questions." />
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Save</Button>
                  <Button size="sm" onClick={() => scoreMut.mutate()} disabled={scoreMut.isPending} className="bg-gradient-hero">
                    <Sparkles className="mr-1 h-4 w-4" /> {scoreMut.isPending ? "Scoring…" : "Get AI feedback"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {currentFb && (
            <Card className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-3xl font-bold">{currentFb.score}</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Strengths</h4>
                  <ul className="mt-1 space-y-1 text-sm">
                    {currentFb.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">Improve</h4>
                  <ul className="mt-1 space-y-1 text-sm">
                    {currentFb.improvements.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold">Ideal answer</h4>
                <p className="mt-1 text-sm text-muted-foreground">{currentFb.ideal_answer}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
