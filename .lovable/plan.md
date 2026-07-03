## Current State

The app already has most of this built. Before adding anything new, here's what exists:

**Seeker side (working):**
- Resume builder with sections (profile, summary, experience, education, skills, projects, certifications, links) at `/resumes/$id`
- Resume versioning + duplicate + draft save
- Application tracker at `/tracker`
- Jobs list at `/jobs`, saved jobs, job alerts at `/alerts`
- Interview practice with categories + AI feedback at `/interview`
- Cover letters at `/cover-letters`
- Profile settings at `/profile`
- Help centre at `/help` (FAQs + contact)
- Onboarding role picker (seeker vs company)

**Company side:** basic recruiter page at `/recruiter`
**Admin:** `/admin` (passcode-gated, already noindex, not linked from landing/dashboard nav based on current header)
**Landing:** `/` marketing page

## What's Actually Missing / Weak

Scoping this plan to real gaps — not rebuilding what works.

### 1. Template selection step in resume builder
Currently the builder goes straight to a single preview. Add:
- A "Template" step at the end of the section stepper
- 4-5 ATS-friendly template options (Classic, Modern, Minimal, Executive, Compact)
- Store `template` on `resumes.content.template`
- `ResumePreview` + PDF export switch layout based on template
- Thumbnail gallery with live selection

### 2. Company dashboard
`/recruiter` is thin. Expand into a real dashboard at `/company`:
- Overview (active jobs, total applicants, new this week)
- Job posting CRUD (reuse `JobForm`, scope to `posted_by = auth.uid()`)
- Applicant list per job with status pipeline (new → shortlisted → interview → offer → rejected)
- Candidate review drawer (resume preview, notes, status change)
- Requires `applications.recruiter_status` + owner-scoped RLS on jobs (verify existing policy allows recruiter reads of their applicants)

### 3. Role-based layouts + admin hiding
- `DashboardShell` currently shows the same sidebar for everyone. Split nav by `profile.account_type`:
  - `job_seeker` → Dashboard, Resumes, Jobs, Tracker, Interview, Cover Letters, Alerts, Profile, Help
  - `company` → Overview, Post Job, Applicants, Interviews, Profile, Help
- Admin link: remove from any visible nav (confirm none present) and only render when `user_roles` contains `admin` for the current user. Add a `useIsAdmin()` hook backed by a server fn.
- Verify landing page + dashboard have zero admin references.

### 4. Auto-redirect by role
After login/onboarding, seekers → `/dashboard`, companies → `/company`. Companies hitting seeker routes get redirected and vice versa (soft — just a nav that reflects their role, don't hard-block).

### 5. Polish
- Empty states on Applicants, Interviews, Saved jobs (audit each)
- Loading skeletons on dashboard cards
- Template thumbnails as generated preview SVGs (inline, no image gen)

## Out of Scope (already done, don't touch)

- Auth flows, onboarding, help centre, FAQ, interview AI, job alerts, cover letters, landing page copy, Supabase schema for existing tables, admin passcode flow, JT logo.

## Technical Notes

- New file: `src/components/resume-templates/` with `classic.tsx`, `modern.tsx`, `minimal.tsx`, `executive.tsx`, `compact.tsx` — each takes `ResumeContent` and renders print-friendly markup. Registry map keyed by template id.
- `ResumePreview` becomes a thin dispatcher on `content.template ?? "classic"`.
- `resume-pdf.tsx` gets same template switch.
- New routes under `_authenticated/company.*`: `index`, `jobs`, `applicants`, `interviews`.
- New server fns in `src/lib/api/company.functions.ts`: `listMyJobs`, `listMyApplicants`, `updateApplicantStatus`.
- Migration (small): `applications.recruiter_status` enum column + owner-side SELECT policy so recruiters can read applicants for jobs they posted.
- New `useIsAdmin` reads from a new `checkIsAdmin` server fn (queries `user_roles` under `requireSupabaseAuth`, no passcode).

## Delivery order

1. Migration (recruiter_status + policy)
2. Template registry + selector step + PDF switch
3. Company dashboard routes + server fns
4. Role-aware `DashboardShell` nav
5. `useIsAdmin` + hide admin everywhere
6. Empty/loading/error state audit
