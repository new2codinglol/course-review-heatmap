# Course Review Heatmap — Design Spec

**Date:** 2026-06-09
**Status:** Approved design, pre-implementation
**Supersedes:** `COURSE_HEATMAP_PRD.md` (the original PRD; kept as historical starting point)
**Stack:** React (Vite) + Tailwind + Supabase + Chart.js + Zustand, deployed on Vercel

---

## 1. What this is

A dense, terminal-style **course-reputation heatmap** for a Malaysian public-university
context (UTM-inspired). Students can both:

- **Read** aggregated course reputation across many courses and semesters as a scannable heatmap, and
- **Submit** their own course review through a validated form that writes to a real database.

This is a **portfolio / craft project** whose explicit secondary goal is for the author to
**learn backend** (the previous project had no backend). Therefore the backend is not a
read-only `SELECT` — it includes real writes, database-level validation, and Row Level
Security (RLS).

The data is **synthetic** (seeded). This is stated honestly in the README; the project's
value is the visualization and full-stack ownership, not real enrollment advice.

---

## 2. Goals & non-goals

### Goals
- A genuinely dense heatmap (~25 courses × 8 semesters ≈ 200 cells) that unmistakably reads as a heatmap.
- A real backend write path: submission form → validation → `INSERT`, governed by RLS.
- Aggregation done in the database (a Postgres view), not pre-computed and stored.
- Accessible, colorblind-safe value encoding.
- A distinctive, committed "terminal / data-instrument" visual direction (not generic indigo SaaS).
- Reliable live demo with honest documentation of its tradeoffs.

### Non-goals (MVP)
- **Authentication / user accounts.** Submissions are anonymous.
- Editing or deleting submissions from the client.
- Search by professor name, notifications, PDF export, comments/discussion.
- Admin panel.

---

## 3. Key decisions (and why)

| Decision | Choice | Why |
|---|---|---|
| Backend role | Real writes, not read-only | Author's goal is to learn backend; a `SELECT` teaches almost nothing. |
| Backend depth | Submission + validation + RLS, **no auth** | Core backend muscles (schema, inserts, RLS, constraints) without auth's edge-case sprawl. |
| Data model | One row per submission, aggregate via a view | Real backend practice (views/aggregation); matches a true submission flow. |
| Grid density | ~25 courses × 8 semesters | A 4-column grid reads as a table; density makes it a heatmap and makes the fill animation land. |
| Visual direction | Terminal / data-instrument, OKLCH | Drops the generic indigo-SaaS look the author's CLAUDE.md says to avoid; fits a cybersecurity identity. |
| Cell encoding | Heat color **+ printed value** in every cell | Colorblind-safe by construction (redundant encoding); suits the dense terminal aesthetic. |
| Heat ramp | Colorblind-safe **sequential** OKLCH (not red→green) | Red→green is the #1 colorblind failure case (~8% of men). |
| Attendance metric | `% required` (sequential), with "not required" distinct | Replaces the weak binary 2-color grid with a real metric. |
| State | Zustand | Lighter than Context/Redux for metric + filter + drawer state. |
| Hosting | Vercel | One-click deploy, env vars, fast. |

---

## 4. Data model (Supabase / Postgres)

### `courses`
```
id            uuid  PK
code          text  e.g. "SECJ3553"
name          text  e.g. "Network Security"
faculty       text  e.g. "Computing"
department    text  e.g. "Cybersecurity"
credit_hours  int
```

### `semesters`
```
id      uuid  PK
label   text  e.g. "Sem 1 2023/2024"
year    int
season  text  "Sem 1" | "Sem 2" | "Sem 3"
sort_order int  monotonic, for chronological column ordering
```

### `reviews` — one row per submission (changed from PRD's pre-aggregated table)
```
id                  uuid  PK   default gen_random_uuid()
course_id           uuid  FK → courses.id   (not null)
semester_id         uuid  FK → semesters.id (not null)
professor_rating    numeric  CHECK (professor_rating BETWEEN 1 AND 5)
grade_points        numeric  CHECK (grade_points BETWEEN 0 AND 4)   -- reviewer's own grade, Malaysian 4.0 scale
workload            numeric  CHECK (workload BETWEEN 1 AND 5)       -- 1=very light, 5=very heavy
attendance_required bool     not null
attendance_pct      int      CHECK (attendance_pct BETWEEN 0 AND 100)  -- nullable when not required
notes               text     CHECK (char_length(notes) <= 1000)     -- optional freeform
created_at          timestamptz default now()
```
Every numeric range is enforced by a **CHECK constraint** — database-level validation, not
just client-side. This is intentional backend learning.

### `course_semester_stats` — Postgres VIEW (aggregation)
Aggregates `reviews` grouped by `(course_id, semester_id)`:
```
course_id, semester_id,
avg_rating      = avg(professor_rating)
avg_gpa         = avg(grade_points)
avg_workload    = avg(workload)
pct_attendance_required = avg(attendance_required::int) * 100
sample_size     = count(*)
```
The heatmap reads this view. The drawer reads the underlying `reviews` rows for the
grade-distribution chart.

### Seed strategy
- ~25 courses across UTM-style faculties/departments (SECJ Security, SCSJ Computer Science,
  SECR Cybersecurity, plus a couple of other Computing/Engineering depts for the faculty filter).
- 8 semesters spanning ~4 academic years.
- Multiple synthetic `reviews` rows per populated `(course, semester)` cell so that
  `sample_size` varies realistically (some cells dense, some sparse, some empty).
- Some cells intentionally left empty to exercise the empty-cell state.

---

## 5. Backend behavior & security

### Reads (anonymous)
- `SELECT` allowed on `courses`, `semesters`, and the `course_semester_stats` view.
- Heatmap fetches the aggregated view. Empty cell = no submissions for that
  `(course, semester)` → rendered gray with a dash.

### Writes (anonymous)
- Submission form → client-side validation → `INSERT` into `reviews`.
- **RLS policies:**
  - Anonymous `SELECT` on `courses`, `semesters`, view.
  - Anonymous `INSERT` on `reviews` permitted **only** when values satisfy constraints
    (ranges enforced both by CHECK constraints and validated client-side).
  - **No** `UPDATE` / `DELETE` from the client.
- **Spam tradeoff (documented honestly):** no auth means no per-user rate limit. Acceptable
  for a synthetic-data portfolio demo; noted in README. (Out of scope: captcha, rate limiting.)

### Keys
- **anon key** is safe in client code (protected by RLS) — committed config is fine.
- **`service_role` key must never be committed.** `.env` + `.gitignore` from the first commit;
  service_role used only for local seeding scripts, never shipped to the client bundle.

### Reliability tradeoff
- Supabase free-tier projects pause after ~7 days of inactivity, which can make a
  sporadically-visited demo appear broken.
- Mitigation: documented in README; optionally a small scheduled keep-alive ping. Flagged
  openly rather than hidden.

---

## 6. Heatmap & encoding

- **Cell = heat color + printed value** (e.g. `4.2`). Redundant encoding = colorblind-safe.
- **Heat ramp:** colorblind-safe **sequential** OKLCH scale (not red→green). Each metric maps
  its value range onto this ramp.
- **Sample-size confidence:** cells with few reviews are visually de-emphasized (e.g. lower
  opacity or a corner tick) so a 1-review cell does not look as authoritative as a 30-review
  cell. Honest data viz.
- **Metrics** (switcher): Rating, GPA, Workload, Attendance.
  - Legend states direction explicitly per metric (e.g. "Workload: light → heavy").
  - **Attendance** shows `% required` on the sequential ramp; "not required" is a distinct state.
- **States:** loading skeleton (gray cells), empty cell (gray + dash), empty-after-filter,
  fetch error.
- **Signature animation:** staggered left→right column fill-in on load (now reads across 8
  columns). Respects `prefers-reduced-motion`. Content renders without JS (animation is
  progressive enhancement only).

---

## 7. UI / components

| Component | Purpose |
|---|---|
| `HeatmapGrid` | CSS-grid layout: course rows × semester columns. |
| `HeatmapCell` | Single cell: heat color + printed value + confidence cue + click target. |
| `MetricSwitcher` | Tab group: Rating / GPA / Workload / Attendance. Recolors grid instantly. |
| `FilterBar` | Faculty + department dropdowns; "Clear filters". Narrows visible rows. |
| `CourseDrawer` | Right-side slide-in: course/semester detail, rating stars, **Chart.js** grade-distribution bar chart from real `reviews` rows, workload badge, attendance policy, sample size. Close button + click-outside. |
| `Legend` | Always-visible color-scale legend; updates label per active metric. |
| `SubmitReviewForm` | **New.** Dedicated form (own route or modal) → validated `INSERT` into `reviews`. |

**Aesthetic:** terminal / data-instrument. Tinted near-black background, JetBrains Mono for
course codes, Inter (or similar) for UI body, one sharp OKLCH accent, hairline borders, dense
readable numbers. OKLCH color throughout. Committed dark direction.

### Suggested file structure
```
src/
├── components/
│   ├── HeatmapGrid.jsx
│   ├── HeatmapCell.jsx
│   ├── MetricSwitcher.jsx
│   ├── FilterBar.jsx
│   ├── CourseDrawer.jsx
│   ├── GradeChart.jsx
│   ├── Legend.jsx
│   └── SubmitReviewForm.jsx
├── hooks/
│   ├── useStats.js        # fetch aggregated course_semester_stats
│   ├── useCourses.js      # fetch courses + semesters (+ filter options)
│   ├── useCellDetail.js   # fetch underlying reviews for a cell
│   └── useSubmitReview.js # validated INSERT
├── lib/
│   ├── supabase.js        # client init (anon key)
│   └── colorScale.js      # metric value → OKLCH heat color
├── store/
│   └── appStore.js        # Zustand: active metric, filters, drawer state
└── App.jsx
```

---

## 8. Tech stack

| Concern | Choice |
|---|---|
| Frontend | React (Vite) |
| Styling | Tailwind CSS (OKLCH via custom theme tokens) |
| Charts | Chart.js + react-chartjs-2 (drawer grade distribution) |
| Heatmap rendering | Custom CSS Grid + dynamic background color |
| Backend / DB | Supabase (Postgres + REST + RLS) |
| State | Zustand |
| Hosting | Vercel |

---

## 9. Roadmap (revised; ~8–9 days)

### Phase 0 — Setup
- Init Vite + React; install Tailwind, Chart.js, react-chartjs-2, Supabase JS, Zustand.
- Create Supabase project; define `courses`, `semesters`, `reviews` + CHECK constraints.
- Create `course_semester_stats` view.
- Configure RLS policies (anon SELECT; constrained anon INSERT; no UPDATE/DELETE).
- Seed script (service_role, local only): ~25 courses × 8 semesters with varied review counts.
- `.env` + `.gitignore`; connect client with anon key; verify a basic fetch.

### Phase 1 — Core heatmap (read)
- `HeatmapGrid` static layout, then wire to `course_semester_stats`.
- `colorScale.js` (metric → OKLCH); printed value in cells.
- Loading skeleton; empty-cell handling; sample-size confidence cue.

### Phase 2 — Interactivity
- `MetricSwitcher` → recolor grid (Zustand).
- `FilterBar` (faculty/department) → narrow rows; clear filters; empty-after-filter state.

### Phase 3 — Detail drawer
- `CourseDrawer` slide-in; on cell click pass course_id + semester_id.
- `useCellDetail` fetches underlying `reviews`; render stars, Chart.js distribution, workload,
  attendance, sample size; close behavior.

### Phase 4 — Submission (the backend learning core)
- `SubmitReviewForm` with client-side validation mirroring CHECK constraints.
- `useSubmitReview` → `INSERT`; success/error states; new submission reflected after refetch.
- Verify RLS rejects out-of-range / disallowed operations.

### Phase 5 — Polish
- `Legend` per-metric; staggered fill-in animation + reduced-motion; responsive (horizontal
  scroll for grid on mobile); error state for fetch failure.

### Phase 6 — Deploy + resume-ready
- Deploy to Vercel; env vars configured.
- `README.md`: purpose, stack, **synthetic-data note**, RLS/security note, Supabase pausing
  tradeoff, setup, live demo link.
- Resume bullet (honest — emphasize RLS + validation + aggregation, not "real-time").

---

## 10. Honest framing (README must say)
- Data is synthetic / UTM-inspired; not real enrollment advice.
- Submissions are anonymous and unmoderated (no auth) — a deliberate MVP scope choice.
- Demo may be paused by Supabase free tier after inactivity; how to wake it.

---

## 11. Open items deferred to implementation plan
- Exact OKLCH ramp stops and per-metric value→color mapping.
- Submission form placement: dedicated route vs modal (lean: modal launched from a header CTA).
- Whether to add the scheduled keep-alive ping.
- Exact confidence-cue treatment (opacity vs corner tick).
