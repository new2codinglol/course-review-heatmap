# Course Review Heatmap — PRD & Roadmap
**Version:** 1.0 (MVP)
**Stack:** React + Supabase + Chart.js
**Target:** Portfolio project for cybersecurity / CS student (Malaysian university context)

---

## 1. Problem Statement

Students at Malaysian public universities have no centralized, visual way to compare courses across semesters. Word-of-mouth and random forum posts are the only tools available. This app turns scattered course reputation data into a scannable, data-driven heatmap — helping students make better enrollment decisions.

---

## 2. Target Users

| User | Goal |
|---|---|
| Undergraduate student | Compare courses before enrollment |
| Returning student | Track grade trends for their own courses |
| (Future) Admin / contributor | Submit course review data |

For MVP, focus entirely on the **read-only student viewer**. No auth, no submission, no admin panel.

---

## 3. MVP Scope (Build This First)

### ✅ In Scope
- Heatmap grid — courses (rows) × semesters (columns), colored by a selected metric
- Metric switcher — toggle between: Professor Rating, Grade Distribution (avg GPA), Workload, Attendance Requirement
- Course detail drawer — click a cell to see full breakdown for that course × semester
- Filter bar — filter by Faculty / Department
- Seeded Supabase data — realistic Malaysian university course codes and structure (UTM-style)
- Responsive layout — desktop primary, mobile functional

### ❌ Out of Scope for MVP
- User authentication
- Course review submission form
- Search by professor name
- Notifications or alerts
- PDF/export feature
- Comments or discussion

---

## 4. Data Model (Supabase)

### `courses` table
```
id            uuid  PK
code          text  e.g. "SECJ3553"
name          text  e.g. "Network Security"
faculty       text  e.g. "Computing"
department    text  e.g. "Cybersecurity"
credit_hours  int
```

### `semesters` table
```
id      uuid  PK
label   text  e.g. "Sem 1 2023/2024"
year    int
season  text  "Sem 1" | "Sem 2" | "Sem 3"
```

### `course_reviews` table
```
id                  uuid  PK
course_id           uuid  FK → courses.id
semester_id         uuid  FK → semesters.id
professor_rating    float   1.0–5.0
avg_gpa             float   0.0–4.0  (Malaysian scale: A=4.0, A-=3.7, B+=3.3...)
workload_score      float   1.0–5.0  (1=very light, 5=very heavy)
attendance_required bool
attendance_pct      int     e.g. 80 (means 80% required)
sample_size         int     number of reviews aggregated
notes               text    optional freeform
```

> **Seed strategy:** Pre-populate with ~8 courses × 4 semesters = 32 rows of realistic synthetic data. Use real UTM course codes from the SECJ (Security), SCSJ (Computer Science), SECR (Cybersecurity) faculties.

---

## 5. Features — Detailed

### F1: Heatmap Grid
- Rows = courses (code + name)
- Columns = semesters (chronological, left → right)
- Each cell = colored square based on active metric
- Color scale:
  - Professor Rating → green (high) to red (low)
  - GPA → green (high) to red (low)
  - Workload → green (light) to red (heavy) — inverted intent
  - Attendance → binary: green (not required) / orange (required)
- Empty cells (no data for that semester) = gray with dash

### F2: Metric Switcher
- Tab/button group above the heatmap
- Options: `Rating` | `GPA` | `Workload` | `Attendance`
- Switching re-colors the entire grid instantly (no reload)

### F3: Course Detail Drawer
- Clicking any cell slides open a right-side drawer
- Shows: course name, code, semester, professor rating (stars), GPA distribution bar chart (A / A- / B+ / B / etc.), workload badge, attendance policy, sample size
- Chart.js horizontal bar chart for grade distribution
- Close button or click-outside to dismiss

### F4: Filter Bar
- Dropdown: All Faculties → Computing / Engineering / Science / etc.
- Dropdown: All Departments → Cybersecurity / Software Eng / etc.
- Filters narrow visible rows in the heatmap
- "Clear filters" button

### F5: Legend
- Always-visible color scale legend anchored below the heatmap
- Updates label when metric changes (e.g. "Workload: Light → Heavy")

---

## 6. Design Direction

**Aesthetic:** Data-dense, dark mode, monospaced course codes — feels like a terminal-meets-dashboard. Not a student portal, not a generic SaaS UI.

**Palette:**
- Background: `#0F1117` (near-black)
- Surface: `#1A1D27`
- Border: `#2E3145`
- Text primary: `#E8EAED`
- Text muted: `#6B7280`
- Accent: `#6366F1` (indigo) — hover states, active tabs
- Heat scale: `#EF4444` (red) → `#F59E0B` (amber) → `#22C55E` (green)

**Typography:**
- Display / labels: `JetBrains Mono` — course codes feel native in monospace
- Body / UI: `Inter` — clean and readable for data labels

**Signature element:** The heatmap cells subtly pulse on load (staggered CSS animation, 300ms delay per column) — the grid "fills in" left to right as if data is being fetched. One memorable moment, nothing else animated.

---

## 7. Tech Stack Decisions

| Concern | Choice | Why |
|---|---|---|
| Frontend | React (Vite) | Fast dev, component model fits heatmap + drawer |
| Styling | Tailwind CSS | Utility-first, consistent spacing |
| Charts | Chart.js + react-chartjs-2 | Grade distribution bar chart in drawer |
| Heatmap rendering | Custom CSS Grid | Chart.js heatmap plugin is overkill; CSS grid + dynamic bg-color is simpler and more controllable |
| Backend / DB | Supabase | Postgres + REST + realtime, free tier sufficient, good resume signal |
| State | React Context or Zustand | Metric selection + filter state, no need for Redux |
| Hosting | Vercel | One-click deploy, free, fast |

---

## 8. Project Roadmap

### Phase 0 — Setup (Day 1)
- [ ] Init Vite + React project
- [ ] Install Tailwind, Chart.js, react-chartjs-2, Supabase JS client
- [ ] Create Supabase project, define schema (4 tables above)
- [ ] Seed database with synthetic data (8 courses × 4 semesters)
- [ ] Connect Supabase client in React, test a basic fetch

### Phase 1 — Core Heatmap (Day 2–3)
- [ ] Build `HeatmapGrid` component — static layout first, hardcoded data
- [ ] Wire Supabase fetch — replace hardcoded with live data
- [ ] Implement color scale logic (metric → hex color per cell)
- [ ] Add loading skeleton (gray cells while fetching)
- [ ] Add empty cell handling (no data for semester)

### Phase 2 — Interactivity (Day 3–4)
- [ ] Build `MetricSwitcher` component — tabs for Rating / GPA / Workload / Attendance
- [ ] Wire metric state to heatmap recolor (no page reload)
- [ ] Build `FilterBar` — faculty and department dropdowns
- [ ] Wire filter state to narrow heatmap rows

### Phase 3 — Detail Drawer (Day 4–5)
- [ ] Build `CourseDrawer` slide-in component
- [ ] On cell click → pass course_id + semester_id to drawer
- [ ] Fetch detailed `course_reviews` row for selected cell
- [ ] Render: rating stars, GPA bar chart (Chart.js), workload badge, attendance info
- [ ] Add close behavior (button + outside click)

### Phase 4 — Polish (Day 5–6)
- [ ] Add Legend component (color scale bar)
- [ ] Implement load animation (staggered cell fill-in)
- [ ] Responsive layout — horizontal scroll on mobile for heatmap
- [ ] Empty state — no results after filtering
- [ ] Error state — Supabase fetch failure

### Phase 5 — Deploy + Resume-Ready (Day 6–7)
- [ ] Deploy to Vercel
- [ ] Add `README.md` with: project purpose, tech stack, data note (synthetic, UTM-inspired), setup instructions, live demo link
- [ ] Write 2–3 sentence resume bullet describing the project
- [ ] (Optional) Add `CONTRIBUTING.md` — how someone could add real data

---

## 9. Suggested File Structure

```
src/
├── components/
│   ├── HeatmapGrid.jsx       # Main grid
│   ├── HeatmapCell.jsx       # Single cell with color logic
│   ├── MetricSwitcher.jsx    # Tab group
│   ├── FilterBar.jsx         # Faculty/dept dropdowns
│   ├── CourseDrawer.jsx      # Slide-in detail panel
│   ├── GradeChart.jsx        # Chart.js bar chart
│   └── Legend.jsx            # Color scale legend
├── hooks/
│   ├── useCourses.js         # Fetch + cache courses
│   ├── useReviews.js         # Fetch reviews by filters
│   └── useCellDetail.js      # Fetch single cell detail
├── lib/
│   ├── supabase.js           # Supabase client init
│   └── colorScale.js         # Metric → hex color logic
├── context/
│   └── AppContext.jsx        # Active metric + filters state
└── App.jsx
```

---

## 10. Resume Bullet (Draft)

> Built a full-stack course review heatmap using React, Supabase, and Chart.js — visualizing professor ratings, grade distributions, workload, and attendance requirements across semesters for Malaysian university courses. Designed a custom CSS Grid heatmap with dynamic color scaling, an interactive detail drawer, and real-time Supabase queries with filter state management.

---

## 11. What Makes This Portfolio-Worthy

1. **Full-stack ownership** — you designed the schema, seeded the data, built the UI, and deployed it
2. **Non-trivial data visualization** — not just a bar chart, but a 2D interactive heatmap with state-driven recoloring
3. **Practical problem** — solves a real student pain point, which shows product thinking
4. **Clean architecture** — component separation, custom hooks, context state — shows you know React beyond tutorials
5. **Live URL** — always link to the Vercel deploy; recruiters click things

---

*Document prepared for Claude Code implementation. Start with Phase 0 setup and proceed sequentially.*
