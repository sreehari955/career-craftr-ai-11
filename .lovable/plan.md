# Plan: 5 new JobTrack-AI features

## 1. AI Interview Practice Mode
- New table `interview_sessions` (user_id, job_id, questions jsonb, answers jsonb, feedback jsonb, created_at)
- Server fn `generateInterviewQuestions({ job_id, count, type })` → Gemini generates 6 mock questions (behavioral + technical) from the job description
- Server fn `scoreInterviewAnswer({ session_id, question_index, answer_text })` → AI feedback per answer
- New route `/_authenticated/interview` lists sessions; `/_authenticated/interview/$id` shows Q&A
- Recording: use browser MediaRecorder → upload audio blob to a new `interview-audio` Supabase Storage bucket (private, RLS scoped to user). Store URL alongside transcribed text (user types or pastes transcript; full STT is out of scope — keep recording + text answer)

## 2. Resume Version History + Diff
- Reuse existing `resumes` table; add column `parent_resume_id uuid` and `version int` so tailored versions link back to master
- New route `/_authenticated/resumes/$id/history` shows all resumes sharing the same root (master + every tailored derivative)
- Side-by-side diff: render two resumes' content fields with section-level diff (use `diff` npm package) highlighting added/removed/changed lines
- Picker lets user choose any two versions to compare

## 3. Saved Job Alerts
- New table `job_alerts` (user_id, name, keywords text[], locations text[], job_types text[], created_at, last_checked_at)
- New table `alert_matches` (alert_id, job_id, seen boolean, created_at)
- Route `/_authenticated/alerts` to create/edit/delete alerts
- pg_cron job every hour calling a public route `/api/public/run-job-alerts` (apikey-gated) that scans jobs vs each alert and inserts unseen matches
- Dashboard bell shows unseen match count; clicking opens alerts page

## 4. Application Email Helper
- Server fn `draftRecruiterEmail({ resume_id, job_id, tone })` → Gemini drafts 120-180 word email with subject + body, returns `{ subject, body }`
- Add an "Email recruiter" button on the Jobs detail/applications view that opens a dialog, generates the draft, lets the user copy or open in `mailto:` link

## 5. PDF Export of Tailored Resumes
- Client-side export using `@react-pdf/renderer` (works in Worker-safe browser path)
- New component `ResumePdfDoc` that renders a clean ATS-friendly single-column layout from `ResumeContentT`
- "Download PDF" button on resume editor and resume cards triggers `pdf(<ResumePdfDoc/>).toBlob()` and saves via FileSaver

## Order of work
1. Migration: `parent_resume_id`/`version` on resumes; new tables `interview_sessions`, `job_alerts`, `alert_matches`; storage bucket for interview audio.
2. Server fns: interview AI, draft email, run-alerts route, scheduling cron.
3. Frontend: routes for interview, history/diff, alerts, dialogs for email + PDF.
4. Sidebar nav updates in `dashboard-shell.tsx`.

## Out of scope (call out)
- Real-time speech-to-text transcription (user types/pastes their spoken answer; recording is saved for self-review)
- Push/email notifications for job alerts — surfaced in-app only via bell badge (can be added later)
- Server-side PDF generation — done client-side for speed
