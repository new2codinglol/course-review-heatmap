# Course Review Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dense, terminal-style course-reputation heatmap (~25 courses × 8 semesters) where students read aggregated reputation and submit their own validated reviews, backed by Supabase with RLS.

**Architecture:** React (Vite) SPA reads an aggregated Postgres view (`course_semester_stats`) for the heatmap and underlying `reviews` rows for a detail drawer. Writes go through a validated form into `reviews`, governed by RLS + CHECK constraints. Pure logic (color scale, validation, store) is TDD'd with Vitest; visual components are verified in a real browser. Colorblind-safe sequential OKLCH ramp, value printed in every cell.

**Tech Stack:** React + Vite, Tailwind (OKLCH tokens), Zustand, Supabase JS, Chart.js + react-chartjs-2, Vitest + @testing-library/react, deployed on Vercel.

**Reference spec:** `docs/superpowers/specs/2026-06-09-course-review-heatmap-design.md`

---

## File Structure

```
.env.example                         # documents required env vars (committed)
.env                                 # real keys (gitignored)
index.html
vite.config.js                       # vite + vitest config
tailwind.config.js                   # OKLCH theme tokens, JetBrains Mono
postcss.config.js
src/
├── main.jsx                         # React entry
├── App.jsx                          # layout: header, filter, switcher, grid, legend, drawer
├── index.css                        # Tailwind directives + base terminal styles
├── lib/
│   ├── supabase.js                  # client init (anon key)
│   ├── colorScale.js                # metric value → OKLCH heat color (PURE, tested)
│   ├── metrics.js                   # metric definitions: key, label, domain, direction
│   └── validation.js                # review form validation (PURE, tested)
├── store/
│   └── appStore.js                  # Zustand: metric, filters, drawer (tested)
├── hooks/
│   ├── useCourses.js                # fetch courses + semesters
│   ├── useStats.js                  # fetch course_semester_stats
│   ├── useCellDetail.js             # fetch reviews for one (course, semester)
│   └── useSubmitReview.js           # validated INSERT
├── components/
│   ├── HeatmapGrid.jsx
│   ├── HeatmapCell.jsx
│   ├── MetricSwitcher.jsx
│   ├── FilterBar.jsx
│   ├── Legend.jsx
│   ├── CourseDrawer.jsx
│   ├── GradeChart.jsx
│   └── SubmitReviewForm.jsx
└── test/
    └── setup.js                     # testing-library/jest-dom matchers
supabase/
├── schema.sql                       # tables + CHECK constraints + view + RLS
└── seed.mjs                         # local seed script (service_role)
```

---

## Phase 0 — Project & Backend Foundation

### Task 1: Scaffold Vite + React project

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

- [ ] **Step 1: Scaffold with Vite**

Run in project root (it already contains `.git`, `.gitignore`, `docs/`, `COURSE_HEATMAP_PRD.md`):
```bash
npm create vite@latest . -- --template react
```
If prompted that the directory is not empty, choose **"Ignore files and continue"**.

- [ ] **Step 2: Install runtime + dev dependencies**

```bash
npm install @supabase/supabase-js zustand chart.js react-chartjs-2
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Vitest in `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 4: Create `src/test/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to `package.json`**

In the `"scripts"` block add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Verify dev server boots**

Run: `npm run dev`
Expected: Vite prints a `localhost:5173` URL and the default page serves with no errors. Stop the server (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React with Vitest"
```

---

### Task 2: Configure Tailwind v4 with OKLCH terminal theme

> **Tailwind v4 note:** This project installed Tailwind **v4** (`^4.3.0`). v4 is CSS-first:
> no `tailwind.config.js`, no `npx tailwindcss init`, no `@tailwind` directives, and no
> separate `postcss.config.js` when using the official Vite plugin. Theme tokens are declared
> in CSS inside an `@theme {}` block. Color tokens declared as `--color-<name>` automatically
> generate the matching utilities (`--color-bg` → `bg-bg`/`text-bg`, etc.), so all the
> `bg-bg` / `text-text` / `border-border` / `font-mono` class names used in later tasks work.

**Files:**
- Create: none (no config files needed with the Vite plugin)
- Modify: `vite.config.js` (add the Tailwind plugin), `src/index.css`
- Install: `@tailwindcss/vite`

- [ ] **Step 1: Install the official Tailwind v4 Vite plugin**

```bash
npm install -D @tailwindcss/vite
```

- [ ] **Step 2: Add the Tailwind plugin to `vite.config.js`**

Edit `vite.config.js` so it reads exactly:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
```

- [ ] **Step 3: Replace `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap');
@import "tailwindcss";

@theme {
  --color-bg:      oklch(0.17 0.012 264);   /* tinted near-black */
  --color-surface: oklch(0.22 0.014 264);
  --color-border:  oklch(0.30 0.016 264);
  --color-text:    oklch(0.93 0.01 264);
  --color-muted:   oklch(0.62 0.02 264);
  --color-accent:  oklch(0.78 0.16 75);     /* sharp amber accent */

  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-sans: Inter, system-ui, sans-serif;
}

:root { color-scheme: dark; }
body { @apply bg-bg text-text font-sans antialiased; }
```

- [ ] **Step 4: Smoke-test the theme**

Temporarily set `src/App.jsx` to render a single `<div className="p-8 font-mono text-accent">SECJ3553</div>`, run `npm run dev`, confirm the page is near-black with amber monospace text and no console/build errors. Revert the temporary change.

- [ ] **Step 5: Commit**

```bash
git add vite.config.js src/index.css package.json package-lock.json
git commit -m "feat: add OKLCH terminal theme with Tailwind v4"
```

---

### Task 3: Define database schema, view, and RLS

**Files:**
- Create: `supabase/schema.sql`

This task produces SQL you run once in the Supabase SQL editor. No app code yet.

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
-- Extensions
create extension if not exists "pgcrypto";

-- Tables
create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  faculty text not null,
  department text not null,
  credit_hours int not null check (credit_hours between 1 and 6)
);

create table semesters (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  year int not null,
  season text not null check (season in ('Sem 1','Sem 2','Sem 3')),
  sort_order int not null unique
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  semester_id uuid not null references semesters(id) on delete cascade,
  professor_rating numeric not null check (professor_rating between 1 and 5),
  grade_points numeric not null check (grade_points between 0 and 4),
  workload numeric not null check (workload between 1 and 5),
  attendance_required boolean not null,
  attendance_pct int check (attendance_pct between 0 and 100),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create index on reviews (course_id, semester_id);

-- Aggregation view (heatmap reads this)
create view course_semester_stats as
select
  course_id,
  semester_id,
  avg(professor_rating)::numeric(3,2)        as avg_rating,
  avg(grade_points)::numeric(3,2)            as avg_gpa,
  avg(workload)::numeric(3,2)                as avg_workload,
  (avg(attendance_required::int) * 100)::numeric(5,1) as pct_attendance_required,
  count(*)                                   as sample_size
from reviews
group by course_id, semester_id;

-- RLS
alter table courses enable row level security;
alter table semesters enable row level security;
alter table reviews enable row level security;

create policy "anon read courses"   on courses   for select to anon using (true);
create policy "anon read semesters" on semesters for select to anon using (true);
create policy "anon read reviews"   on reviews   for select to anon using (true);

-- Constrained anonymous insert; CHECK constraints enforce ranges, RLS enforces the policy.
create policy "anon insert reviews" on reviews
  for insert to anon
  with check (
    professor_rating between 1 and 5
    and grade_points between 0 and 4
    and workload between 1 and 5
    and (attendance_pct is null or attendance_pct between 0 and 100)
  );
-- No update/delete policies => anon cannot update or delete.
```

- [ ] **Step 2: Create the Supabase project and run the SQL**

1. Create a project at supabase.com (free tier).
2. Open SQL Editor → paste `supabase/schema.sql` → Run.
3. Confirm `courses`, `semesters`, `reviews` tables and `course_semester_stats` view appear under Table/Database.

- [ ] **Step 3: Verify RLS blocks writes to courses**

In SQL editor run as anon is not possible here, so instead verify policy existence:
```sql
select tablename, policyname, cmd from pg_policies where schemaname='public' order by tablename;
```
Expected: `courses`/`semesters`/`reviews` show `SELECT` policies and `reviews` shows an `INSERT` policy. No UPDATE/DELETE rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema, stats view, and RLS policies"
```

---

### Task 4: Environment config and Supabase client

**Files:**
- Create: `.env.example`, `.env`, `src/lib/supabase.js`

- [ ] **Step 1: Create `.env.example` (committed, documents vars)**

```
# Client-safe (protected by RLS) — used by the app
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Local seeding ONLY — never expose to the client bundle, never commit a real value
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- [ ] **Step 2: Create `.env` with real values**

Copy from Supabase → Project Settings → API. `.env` is already gitignored (verify: `git check-ignore .env` prints `.env`).

- [ ] **Step 3: Create `src/lib/supabase.js`**

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anonKey)
```

- [ ] **Step 4: Verify .env is ignored**

Run: `git check-ignore .env`
Expected: prints `.env`. (If it prints nothing, STOP — do not commit.)

- [ ] **Step 5: Commit (env.example + client only)**

```bash
git add .env.example src/lib/supabase.js
git commit -m "feat: add Supabase client and env config"
```

---

### Task 5: Seed script with realistic synthetic data

**Files:**
- Create: `supabase/seed.mjs`

- [ ] **Step 1: Write `supabase/seed.mjs`**

```js
// Local seeding only. Run with: node supabase/seed.mjs
// Uses the service_role key from .env to bypass RLS for bulk insert.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// minimal .env loader (no extra dep)
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim()
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const FACULTIES = {
  Computing: ['Cybersecurity', 'Software Engineering', 'Data Science'],
  Engineering: ['Electrical', 'Mechanical'],
}

// ~25 courses across departments (UTM-style codes)
const COURSES = [
  ['SECJ3553','Network Security','Computing','Cybersecurity',3],
  ['SECR2043','Cryptography','Computing','Cybersecurity',3],
  ['SECR3104','Digital Forensics','Computing','Cybersecurity',3],
  ['SECP3106','Ethical Hacking','Computing','Cybersecurity',3],
  ['SECV1012','Security Fundamentals','Computing','Cybersecurity',3],
  ['SCSJ1013','Programming Technique I','Computing','Software Engineering',3],
  ['SCSJ2153','Object-Oriented Programming','Computing','Software Engineering',3],
  ['SCSJ3203','Software Engineering','Computing','Software Engineering',3],
  ['SCSJ3343','Software Quality Assurance','Computing','Software Engineering',3],
  ['SCSJ2253','Web Programming','Computing','Software Engineering',3],
  ['SCSV2113','Computer Architecture','Computing','Software Engineering',3],
  ['SCSD2613','Data Structures & Algorithms','Computing','Data Science',3],
  ['SCSD3413','Machine Learning','Computing','Data Science',3],
  ['SCSD2513','Database','Computing','Data Science',3],
  ['SCSD3613','Big Data Analytics','Computing','Data Science',3],
  ['SCSD1023','Discrete Structures','Computing','Data Science',3],
  ['SECJ3623','Distributed Systems','Computing','Cybersecurity',3],
  ['SECJ2154','Operating Systems','Computing','Cybersecurity',3],
  ['SKEE2153','Electronics','Engineering','Electrical',4],
  ['SKEE3143','Control Systems','Engineering','Electrical',4],
  ['SKEM1313','Engineering Mechanics','Engineering','Mechanical',4],
  ['SKEM2423','Thermodynamics','Engineering','Mechanical',4],
  ['UHAK1012','Ethnic Relations','Computing','Software Engineering',2],
  ['ULRS1012','Critical Thinking','Computing','Data Science',2],
  ['SCSP3142','Mobile App Development','Computing','Software Engineering',3],
]

const SEMESTERS = [
  ['Sem 1 2021/2022',2021,'Sem 1',1],
  ['Sem 2 2021/2022',2022,'Sem 2',2],
  ['Sem 1 2022/2023',2022,'Sem 1',3],
  ['Sem 2 2022/2023',2023,'Sem 2',4],
  ['Sem 1 2023/2024',2023,'Sem 1',5],
  ['Sem 2 2023/2024',2024,'Sem 2',6],
  ['Sem 1 2024/2025',2024,'Sem 1',7],
  ['Sem 2 2024/2025',2025,'Sem 2',8],
]

const rand = (min, max) => Math.round((min + Math.random() * (max - min)) * 10) / 10
const randint = (min, max) => Math.floor(min + Math.random() * (max - min + 1))

async function main() {
  // wipe in dependency order (reviews -> courses/semesters)
  await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('courses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('semesters').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data: courses, error: cErr } = await supabase.from('courses')
    .insert(COURSES.map(([code,name,faculty,department,credit_hours]) =>
      ({ code, name, faculty, department, credit_hours }))).select()
  if (cErr) throw cErr

  const { data: semesters, error: sErr } = await supabase.from('semesters')
    .insert(SEMESTERS.map(([label,year,season,sort_order]) =>
      ({ label, year, season, sort_order }))).select()
  if (sErr) throw sErr

  const reviews = []
  for (const course of courses) {
    for (const semester of semesters) {
      // ~75% of cells populated; the rest stay empty to exercise the empty state
      if (Math.random() < 0.25) continue
      const n = randint(1, 30) // varied sample size
      const required = Math.random() < 0.6
      for (let i = 0; i < n; i++) {
        reviews.push({
          course_id: course.id,
          semester_id: semester.id,
          professor_rating: rand(1.5, 5),
          grade_points: rand(2, 4),
          workload: rand(1, 5),
          attendance_required: required,
          attendance_pct: required ? randint(60, 90) : null,
          notes: null,
        })
      }
    }
  }
  // insert in chunks of 500
  for (let i = 0; i < reviews.length; i += 500) {
    const { error } = await supabase.from('reviews').insert(reviews.slice(i, i + 500))
    if (error) throw error
  }
  console.log(`Seeded ${courses.length} courses, ${semesters.length} semesters, ${reviews.length} reviews`)
}

main().catch((e) => { console.error(e); process.exit(1) })
```

- [ ] **Step 2: Run the seed**

Run: `node supabase/seed.mjs`
Expected: prints `Seeded 25 courses, 8 semesters, N reviews` with N in the hundreds.

- [ ] **Step 3: Verify the view returns data**

In Supabase SQL editor:
```sql
select * from course_semester_stats limit 5;
```
Expected: rows with `avg_rating`, `avg_gpa`, `sample_size` populated.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.mjs
git commit -m "feat: add synthetic data seed script"
```

---

## Phase 1 — Logic Libraries (TDD)

### Task 6: Metric definitions

**Files:**
- Create: `src/lib/metrics.js`
- Test: `src/lib/metrics.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { METRICS, getMetric } from './metrics'

describe('metrics', () => {
  it('defines the four metrics with domains and stat keys', () => {
    expect(METRICS.map((m) => m.key)).toEqual(['rating','gpa','workload','attendance'])
  })
  it('maps each metric to its stats-view column', () => {
    expect(getMetric('rating').statKey).toBe('avg_rating')
    expect(getMetric('gpa').statKey).toBe('avg_gpa')
    expect(getMetric('workload').statKey).toBe('avg_workload')
    expect(getMetric('attendance').statKey).toBe('pct_attendance_required')
  })
  it('exposes domain [min,max] and direction label for the legend', () => {
    expect(getMetric('rating').domain).toEqual([1, 5])
    expect(getMetric('workload').legend).toMatch(/light/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/metrics.test.js`
Expected: FAIL — cannot resolve `./metrics`.

- [ ] **Step 3: Implement `src/lib/metrics.js`**

```js
export const METRICS = [
  { key: 'rating',     label: 'Rating',     statKey: 'avg_rating',  domain: [1, 5], unit: '',  legend: 'Low → High' },
  { key: 'gpa',        label: 'GPA',        statKey: 'avg_gpa',     domain: [0, 4], unit: '',  legend: 'Low → High' },
  { key: 'workload',   label: 'Workload',   statKey: 'avg_workload',domain: [1, 5], unit: '',  legend: 'Light → Heavy' },
  { key: 'attendance', label: 'Attendance', statKey: 'pct_attendance_required', domain: [0, 100], unit: '%', legend: 'Optional → Required' },
]

export function getMetric(key) {
  const m = METRICS.find((x) => x.key === key)
  if (!m) throw new Error(`Unknown metric: ${key}`)
  return m
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/metrics.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/metrics.js src/lib/metrics.test.js
git commit -m "feat: add metric definitions"
```

---

### Task 7: Colorblind-safe OKLCH color scale

**Files:**
- Create: `src/lib/colorScale.js`
- Test: `src/lib/colorScale.test.js`

The ramp interpolates lightness + chroma along a single hue path that is monotonic in luminance (so it is distinguishable in grayscale = colorblind-safe). Returns an `oklch(...)` CSS string. Empty values return a neutral gray.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { heatColor } from './colorScale'

describe('heatColor', () => {
  it('returns neutral gray for null/undefined value', () => {
    expect(heatColor(null, [1, 5])).toMatch(/oklch/)
    expect(heatColor(null, [1, 5])).toBe(heatColor(undefined, [1, 5]))
  })
  it('returns an oklch string for in-range values', () => {
    expect(heatColor(3, [1, 5])).toMatch(/^oklch\(/)
  })
  it('is monotonic in lightness across the domain (grayscale-distinguishable)', () => {
    const L = (v) => Number(heatColor(v, [1, 5]).match(/oklch\(([\d.]+)/)[1])
    expect(L(1)).toBeLessThan(L(3))
    expect(L(3)).toBeLessThan(L(5))
  })
  it('clamps out-of-range values to the domain ends', () => {
    expect(heatColor(0, [1, 5])).toBe(heatColor(1, [1, 5]))
    expect(heatColor(9, [1, 5])).toBe(heatColor(5, [1, 5]))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/colorScale.test.js`
Expected: FAIL — cannot resolve `./colorScale`.

- [ ] **Step 3: Implement `src/lib/colorScale.js`**

```js
const EMPTY = 'oklch(0.30 0.005 264)' // neutral gray for no-data cells

// low end (dark teal) -> high end (bright yellow-green): monotonic lightness
const LOW  = { l: 0.35, c: 0.08, h: 200 }
const HIGH = { l: 0.88, c: 0.17, h: 120 }

const lerp = (a, b, t) => a + (b - a) * t

export function heatColor(value, [min, max]) {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY
  const clamped = Math.min(max, Math.max(min, value))
  const t = max === min ? 0 : (clamped - min) / (max - min)
  const l = lerp(LOW.l, HIGH.l, t).toFixed(3)
  const c = lerp(LOW.c, HIGH.c, t).toFixed(3)
  const h = lerp(LOW.h, HIGH.h, t).toFixed(1)
  return `oklch(${l} ${c} ${h})`
}

export const EMPTY_COLOR = EMPTY
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/colorScale.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/colorScale.js src/lib/colorScale.test.js
git commit -m "feat: add colorblind-safe OKLCH heat scale"
```

---

### Task 8: Review form validation

**Files:**
- Create: `src/lib/validation.js`
- Test: `src/lib/validation.test.js`

Mirrors the DB CHECK constraints so the client rejects bad input before hitting the network.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest'
import { validateReview } from './validation'

const valid = {
  course_id: 'c1', semester_id: 's1',
  professor_rating: 4, grade_points: 3.5, workload: 3,
  attendance_required: true, attendance_pct: 80, notes: 'ok',
}

describe('validateReview', () => {
  it('passes a valid review', () => {
    expect(validateReview(valid)).toEqual({ ok: true, errors: {} })
  })
  it('requires course and semester', () => {
    const r = validateReview({ ...valid, course_id: '' })
    expect(r.ok).toBe(false)
    expect(r.errors.course_id).toBeTruthy()
  })
  it('rejects out-of-range numbers', () => {
    expect(validateReview({ ...valid, professor_rating: 6 }).errors.professor_rating).toBeTruthy()
    expect(validateReview({ ...valid, grade_points: 5 }).errors.grade_points).toBeTruthy()
    expect(validateReview({ ...valid, workload: 0 }).errors.workload).toBeTruthy()
  })
  it('requires attendance_pct only when attendance is required', () => {
    expect(validateReview({ ...valid, attendance_required: true, attendance_pct: null }).errors.attendance_pct).toBeTruthy()
    expect(validateReview({ ...valid, attendance_required: false, attendance_pct: null }).ok).toBe(true)
  })
  it('rejects notes longer than 1000 chars', () => {
    expect(validateReview({ ...valid, notes: 'x'.repeat(1001) }).errors.notes).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/validation.test.js`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Implement `src/lib/validation.js`**

```js
const inRange = (v, lo, hi) => typeof v === 'number' && !Number.isNaN(v) && v >= lo && v <= hi

export function validateReview(r) {
  const errors = {}
  if (!r.course_id) errors.course_id = 'Select a course'
  if (!r.semester_id) errors.semester_id = 'Select a semester'
  if (!inRange(r.professor_rating, 1, 5)) errors.professor_rating = 'Rating must be 1–5'
  if (!inRange(r.grade_points, 0, 4)) errors.grade_points = 'GPA must be 0–4'
  if (!inRange(r.workload, 1, 5)) errors.workload = 'Workload must be 1–5'
  if (typeof r.attendance_required !== 'boolean') errors.attendance_required = 'Required'
  if (r.attendance_required) {
    if (!inRange(r.attendance_pct, 0, 100)) errors.attendance_pct = 'Enter 0–100%'
  }
  if (r.notes && r.notes.length > 1000) errors.notes = 'Max 1000 characters'
  return { ok: Object.keys(errors).length === 0, errors }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/validation.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.js src/lib/validation.test.js
git commit -m "feat: add review validation mirroring DB constraints"
```

---

### Task 9: Zustand store

**Files:**
- Create: `src/store/appStore.js`
- Test: `src/store/appStore.test.js`

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './appStore'

const get = () => useAppStore.getState()

describe('appStore', () => {
  beforeEach(() => get().reset())
  it('defaults to rating metric, no filters, closed drawer', () => {
    expect(get().metric).toBe('rating')
    expect(get().faculty).toBe('all')
    expect(get().department).toBe('all')
    expect(get().selectedCell).toBeNull()
  })
  it('sets metric', () => {
    get().setMetric('gpa')
    expect(get().metric).toBe('gpa')
  })
  it('setting faculty resets department to all', () => {
    get().setDepartment('Cybersecurity')
    get().setFaculty('Engineering')
    expect(get().department).toBe('all')
  })
  it('opens and closes the drawer', () => {
    get().openCell({ courseId: 'c1', semesterId: 's1' })
    expect(get().selectedCell).toEqual({ courseId: 'c1', semesterId: 's1' })
    get().closeCell()
    expect(get().selectedCell).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/appStore.test.js`
Expected: FAIL — cannot resolve `./appStore`.

- [ ] **Step 3: Implement `src/store/appStore.js`**

```js
import { create } from 'zustand'

const initial = { metric: 'rating', faculty: 'all', department: 'all', selectedCell: null }

export const useAppStore = create((set) => ({
  ...initial,
  setMetric: (metric) => set({ metric }),
  setFaculty: (faculty) => set({ faculty, department: 'all' }),
  setDepartment: (department) => set({ department }),
  clearFilters: () => set({ faculty: 'all', department: 'all' }),
  openCell: (cell) => set({ selectedCell: cell }),
  closeCell: () => set({ selectedCell: null }),
  reset: () => set({ ...initial }),
}))
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/appStore.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/appStore.js src/store/appStore.test.js
git commit -m "feat: add Zustand app store"
```

---

## Phase 2 — Data Hooks

### Task 10: useCourses and useStats hooks

**Files:**
- Create: `src/hooks/useCourses.js`, `src/hooks/useStats.js`

These hooks wrap Supabase fetches. They are verified in-browser in Task 12 (rendering real data), not unit-tested, to avoid mocking the network client.

- [ ] **Step 1: Implement `src/hooks/useCourses.js`**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [c, s] = await Promise.all([
        supabase.from('courses').select('*').order('code'),
        supabase.from('semesters').select('*').order('sort_order'),
      ])
      if (!active) return
      if (c.error || s.error) setError(c.error || s.error)
      else { setCourses(c.data); setSemesters(s.data) }
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  return { courses, semesters, loading, error }
}
```

- [ ] **Step 2: Implement `src/hooks/useStats.js`**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Returns a Map keyed by `${course_id}:${semester_id}` -> stats row.
export function useStats(refreshKey = 0) {
  const [statsMap, setStatsMap] = useState(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase.from('course_semester_stats').select('*')
      if (!active) return
      if (error) setError(error)
      else {
        const map = new Map()
        for (const row of data) map.set(`${row.course_id}:${row.semester_id}`, row)
        setStatsMap(map)
      }
      setLoading(false)
    })()
    return () => { active = false }
  }, [refreshKey])

  return { statsMap, loading, error }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCourses.js src/hooks/useStats.js
git commit -m "feat: add useCourses and useStats hooks"
```

---

### Task 11: useCellDetail and useSubmitReview hooks

**Files:**
- Create: `src/hooks/useCellDetail.js`, `src/hooks/useSubmitReview.js`

- [ ] **Step 1: Implement `src/hooks/useCellDetail.js`**

```js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCellDetail(courseId, semesterId) {
  const [reviews, setReviews] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!courseId || !semesterId) { setReviews(null); return }
    let active = true
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('reviews').select('*')
        .eq('course_id', courseId).eq('semester_id', semesterId)
      if (!active) return
      if (error) setError(error); else setReviews(data)
      setLoading(false)
    })()
    return () => { active = false }
  }, [courseId, semesterId])

  return { reviews, loading, error }
}
```

- [ ] **Step 2: Implement `src/hooks/useSubmitReview.js`**

```js
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { validateReview } from '../lib/validation'

export function useSubmitReview() {
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errors, setErrors] = useState({})

  async function submit(review) {
    const { ok, errors } = validateReview(review)
    if (!ok) { setErrors(errors); setStatus('error'); return { ok: false } }
    setErrors({}); setStatus('submitting')
    const payload = { ...review }
    if (!payload.attendance_required) payload.attendance_pct = null
    const { error } = await supabase.from('reviews').insert(payload)
    if (error) { setStatus('error'); setErrors({ form: error.message }); return { ok: false } }
    setStatus('success')
    return { ok: true }
  }

  return { submit, status, errors, reset: () => { setStatus('idle'); setErrors({}) } }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCellDetail.js src/hooks/useSubmitReview.js
git commit -m "feat: add useCellDetail and useSubmitReview hooks"
```

---

## Phase 3 — Heatmap UI

### Task 12: HeatmapCell + HeatmapGrid (read path)

**Files:**
- Create: `src/components/HeatmapCell.jsx`, `src/components/HeatmapGrid.jsx`
- Test: `src/components/HeatmapCell.test.jsx`

- [ ] **Step 1: Write the failing test for HeatmapCell**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HeatmapCell } from './HeatmapCell'

describe('HeatmapCell', () => {
  it('prints the value and is clickable when populated', () => {
    const onClick = vi.fn()
    render(<HeatmapCell value={4.2} sampleSize={10} domain={[1,5]} onClick={onClick} />)
    expect(screen.getByText('4.2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
  it('renders a dash and is not clickable when empty', () => {
    render(<HeatmapCell value={null} sampleSize={0} domain={[1,5]} onClick={() => {}} />)
    expect(screen.getByText('–')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/HeatmapCell.test.jsx`
Expected: FAIL — cannot resolve `./HeatmapCell`.

- [ ] **Step 3: Implement `src/components/HeatmapCell.jsx`**

```jsx
import { heatColor, EMPTY_COLOR } from '../lib/colorScale'

export function HeatmapCell({ value, sampleSize, domain, unit = '', onClick }) {
  const empty = value === null || value === undefined
  if (empty) {
    return (
      <div className="aspect-square grid place-items-center text-muted text-xs"
           style={{ background: EMPTY_COLOR }} aria-label="No data">–</div>
    )
  }
  // confidence: fewer reviews => lower opacity (min 0.45 at 1 review, full at >=15)
  const confidence = Math.min(1, 0.45 + (sampleSize / 15) * 0.55)
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${sampleSize} review${sampleSize === 1 ? '' : 's'}`}
      className="aspect-square grid place-items-center font-mono text-[11px] font-medium
                 text-bg hover:ring-2 hover:ring-accent focus:ring-2 focus:ring-accent outline-none transition"
      style={{ background: heatColor(value, domain), opacity: confidence }}
    >
      {value.toFixed(1)}{unit}
    </button>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/HeatmapCell.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Implement `src/components/HeatmapGrid.jsx`**

```jsx
import { HeatmapCell } from './HeatmapCell'
import { getMetric } from '../lib/metrics'

export function HeatmapGrid({ courses, semesters, statsMap, metric, onCellClick, loading }) {
  const m = getMetric(metric)
  const cols = `minmax(11rem,1fr) repeat(${semesters.length}, minmax(2.5rem,1fr))`

  if (loading) {
    return <div className="text-muted font-mono text-sm p-8">Loading heatmap…</div>
  }
  if (courses.length === 0) {
    return <div className="text-muted font-mono text-sm p-8">No courses match these filters.</div>
  }

  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <div className="grid min-w-max" style={{ gridTemplateColumns: cols }}>
        {/* header row */}
        <div className="sticky left-0 bg-surface z-10 px-3 py-2 text-muted text-xs font-mono border-b border-border">course</div>
        {semesters.map((s) => (
          <div key={s.id} className="px-1 py-2 text-muted text-[10px] font-mono text-center border-b border-border">
            {s.season.replace('Sem ', 'S')}<br />{String(s.year).slice(2)}
          </div>
        ))}
        {/* body */}
        {courses.map((course, ri) => (
          <Row key={course.id} course={course} semesters={semesters} statsMap={statsMap}
               metric={m} onCellClick={onCellClick} rowIndex={ri} />
        ))}
      </div>
    </div>
  )
}

function Row({ course, semesters, statsMap, metric, onCellClick }) {
  return (
    <>
      <div className="sticky left-0 bg-surface z-10 px-3 py-1 border-b border-border/50 flex flex-col justify-center">
        <span className="font-mono text-accent text-xs">{course.code}</span>
        <span className="text-muted text-[10px] truncate max-w-[9rem]">{course.name}</span>
      </div>
      {semesters.map((s, ci) => {
        const row = statsMap.get(`${course.id}:${s.id}`)
        const value = row ? Number(row[metric.statKey]) : null
        return (
          <div key={s.id} className="border-b border-l border-border/30 fill-in"
               style={{ animationDelay: `${ci * 40}ms` }}>
            <HeatmapCell
              value={value}
              sampleSize={row ? row.sample_size : 0}
              domain={metric.domain}
              unit={metric.unit}
              onClick={() => onCellClick(course.id, s.id)}
            />
          </div>
        )
      })}
    </>
  )
}
```

- [ ] **Step 6: Add the fill-in animation to `src/index.css`**

Append:
```css
@keyframes fillIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
.fill-in { animation: fillIn 320ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .fill-in { animation: none; }
}
```

- [ ] **Step 7: Run the suite**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/HeatmapCell.jsx src/components/HeatmapGrid.jsx src/components/HeatmapCell.test.jsx src/index.css
git commit -m "feat: add heatmap grid and cell with confidence + fill-in"
```

---

### Task 13: Wire App.jsx to render the live heatmap

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace `src/App.jsx`**

```jsx
import { useMemo } from 'react'
import { useCourses } from './hooks/useCourses'
import { useStats } from './hooks/useStats'
import { useAppStore } from './store/appStore'
import { HeatmapGrid } from './components/HeatmapGrid'

export default function App() {
  const { courses, semesters, loading: cLoading, error: cErr } = useCourses()
  const { statsMap, loading: sLoading, error: sErr } = useStats()
  const { metric, faculty, department, openCell } = useAppStore()

  const visibleCourses = useMemo(() => courses.filter((c) =>
    (faculty === 'all' || c.faculty === faculty) &&
    (department === 'all' || c.department === department)
  ), [courses, faculty, department])

  const error = cErr || sErr

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="font-mono text-accent text-xl">course_review_heatmap</h1>
        <p className="text-muted text-sm">Synthetic UTM-inspired data · {visibleCourses.length} courses</p>
      </header>

      {error ? (
        <div className="text-red-400 font-mono text-sm p-8 border border-red-900 rounded">
          Failed to load data: {error.message}
        </div>
      ) : (
        <HeatmapGrid
          courses={visibleCourses}
          semesters={semesters}
          statsMap={statsMap}
          metric={metric}
          loading={cLoading || sLoading}
          onCellClick={(courseId, semesterId) => openCell({ courseId, semesterId })}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in the browser**

Run: `npm run dev`, open the URL.
Expected: a dense heatmap renders with ~25 rows × 8 columns, colored cells with printed values, gray dashes for empty cells, and a left→right fill-in animation on load. Check the browser console for zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: render live heatmap from Supabase"
```

---

## Phase 4 — Interactivity

### Task 14: MetricSwitcher

**Files:**
- Create: `src/components/MetricSwitcher.jsx`
- Test: `src/components/MetricSwitcher.test.jsx`

- [ ] **Step 1: Write the failing test**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MetricSwitcher } from './MetricSwitcher'

describe('MetricSwitcher', () => {
  it('renders all metrics and calls onChange on click', () => {
    const onChange = vi.fn()
    render(<MetricSwitcher value="rating" onChange={onChange} />)
    expect(screen.getByRole('tab', { name: /GPA/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Workload/ }))
    expect(onChange).toHaveBeenCalledWith('workload')
  })
  it('marks the active tab as selected', () => {
    render(<MetricSwitcher value="gpa" onChange={() => {}} />)
    expect(screen.getByRole('tab', { name: /GPA/ })).toHaveAttribute('aria-selected', 'true')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/MetricSwitcher.test.jsx`
Expected: FAIL — cannot resolve `./MetricSwitcher`.

- [ ] **Step 3: Implement `src/components/MetricSwitcher.jsx`**

```jsx
import { METRICS } from '../lib/metrics'

export function MetricSwitcher({ value, onChange }) {
  return (
    <div role="tablist" className="inline-flex gap-1 p-1 bg-surface border border-border rounded-lg">
      {METRICS.map((m) => {
        const active = m.key === value
        return (
          <button
            key={m.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            className={`px-3 py-1.5 rounded font-mono text-xs transition
              ${active ? 'bg-accent text-bg' : 'text-muted hover:text-text'}`}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/MetricSwitcher.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/MetricSwitcher.jsx src/components/MetricSwitcher.test.jsx
git commit -m "feat: add metric switcher"
```

---

### Task 15: FilterBar

**Files:**
- Create: `src/components/FilterBar.jsx`

Derives faculty/department options from the loaded courses. Verified in-browser (pure-presentational with derived options).

- [ ] **Step 1: Implement `src/components/FilterBar.jsx`**

```jsx
export function FilterBar({ courses, faculty, department, onFaculty, onDepartment, onClear }) {
  const faculties = ['all', ...new Set(courses.map((c) => c.faculty))]
  const departments = ['all', ...new Set(
    courses.filter((c) => faculty === 'all' || c.faculty === faculty).map((c) => c.department)
  )]
  const sel = 'bg-surface border border-border rounded px-2 py-1.5 text-xs font-mono text-text'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={sel} value={faculty} onChange={(e) => onFaculty(e.target.value)} aria-label="Faculty">
        {faculties.map((f) => <option key={f} value={f}>{f === 'all' ? 'All faculties' : f}</option>)}
      </select>
      <select className={sel} value={department} onChange={(e) => onDepartment(e.target.value)} aria-label="Department">
        {departments.map((d) => <option key={d} value={d}>{d === 'all' ? 'All departments' : d}</option>)}
      </select>
      {(faculty !== 'all' || department !== 'all') && (
        <button onClick={onClear} className="text-muted hover:text-accent text-xs font-mono underline">clear</button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FilterBar.jsx
git commit -m "feat: add filter bar"
```

---

### Task 16: Legend + wire switcher/filter into App

**Files:**
- Create: `src/components/Legend.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Implement `src/components/Legend.jsx`**

```jsx
import { getMetric } from '../lib/metrics'
import { heatColor } from '../lib/colorScale'

export function Legend({ metric }) {
  const m = getMetric(metric)
  const [min, max] = m.domain
  const stops = [0, 0.25, 0.5, 0.75, 1].map((t) => min + t * (max - min))
  return (
    <div className="flex items-center gap-3 mt-4 text-xs font-mono text-muted">
      <span>{m.label}: {m.legend}</span>
      <div className="flex">
        {stops.map((v) => (
          <span key={v} className="w-8 h-3" style={{ background: heatColor(v, m.domain) }} />
        ))}
      </div>
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 inline-block" style={{ background: 'oklch(0.30 0.005 264)' }} /> no data
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Wire controls into `src/App.jsx`**

Add imports near the top:
```jsx
import { MetricSwitcher } from './components/MetricSwitcher'
import { FilterBar } from './components/FilterBar'
import { Legend } from './components/Legend'
```
Pull the setters from the store — change the store line to:
```jsx
const { metric, setMetric, faculty, setFaculty, department, setDepartment, clearFilters, openCell } = useAppStore()
```
Insert a controls bar between `</header>` and the heatmap block:
```jsx
<div className="flex flex-wrap items-center justify-between gap-3 mb-4">
  <MetricSwitcher value={metric} onChange={setMetric} />
  <FilterBar
    courses={courses}
    faculty={faculty}
    department={department}
    onFaculty={setFaculty}
    onDepartment={setDepartment}
    onClear={clearFilters}
  />
</div>
```
Add `<Legend metric={metric} />` immediately after the `<HeatmapGrid .../>` (still inside the non-error branch).

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`.
Expected: switching tabs instantly recolors the grid; the legend label updates per metric; selecting a faculty narrows rows and resets the department dropdown; "clear" restores all rows. Console clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/Legend.jsx src/App.jsx
git commit -m "feat: wire metric switcher, filters, and legend"
```

---

## Phase 5 — Detail Drawer

### Task 17: GradeChart

**Files:**
- Create: `src/components/GradeChart.jsx`
- Test: `src/components/GradeChart.test.jsx`

Buckets the reviewers' `grade_points` into letter bands and renders a Chart.js horizontal bar. The bucketing is the testable logic; export it separately.

- [ ] **Step 1: Write the failing test**

```jsx
import { describe, it, expect } from 'vitest'
import { bucketGrades } from './GradeChart'

describe('bucketGrades', () => {
  it('buckets grade_points into letter bands', () => {
    const reviews = [{ grade_points: 4 }, { grade_points: 3.7 }, { grade_points: 3.3 }, { grade_points: 2.0 }]
    const b = bucketGrades(reviews)
    expect(b['A']).toBe(1)
    expect(b['A-']).toBe(1)
    expect(b['B+']).toBe(1)
    expect(b['C']).toBe(1)
  })
  it('returns all-zero bands for empty input', () => {
    expect(bucketGrades([]).A).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/GradeChart.test.jsx`
Expected: FAIL — cannot resolve `./GradeChart`.

- [ ] **Step 3: Implement `src/components/GradeChart.jsx`**

```jsx
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const BANDS = [
  ['A', 3.85], ['A-', 3.5], ['B+', 3.15], ['B', 2.85],
  ['B-', 2.5], ['C+', 2.15], ['C', 1.85], ['D', 0.85], ['F', -1],
]

export function bucketGrades(reviews) {
  const out = Object.fromEntries(BANDS.map(([k]) => [k, 0]))
  for (const r of reviews) {
    const band = BANDS.find(([, min]) => r.grade_points >= min)
    if (band) out[band[0]]++
  }
  return out
}

export function GradeChart({ reviews }) {
  const buckets = bucketGrades(reviews)
  const labels = Object.keys(buckets)
  const data = {
    labels,
    datasets: [{ data: labels.map((l) => buckets[l]), backgroundColor: 'oklch(0.78 0.16 75)' }],
  }
  const options = {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#9aa', precision: 0 }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9aa' }, grid: { display: false } },
    },
  }
  return <Bar data={data} options={options} />
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/GradeChart.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/GradeChart.jsx src/components/GradeChart.test.jsx
git commit -m "feat: add grade distribution chart"
```

---

### Task 18: CourseDrawer

**Files:**
- Create: `src/components/CourseDrawer.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Implement `src/components/CourseDrawer.jsx`**

```jsx
import { useEffect } from 'react'
import { useCellDetail } from '../hooks/useCellDetail'
import { GradeChart } from './GradeChart'

const avg = (arr, key) => arr.length ? (arr.reduce((s, r) => s + Number(r[key]), 0) / arr.length) : 0

export function CourseDrawer({ course, semester, onClose }) {
  const open = Boolean(course && semester)
  const { reviews, loading } = useCellDetail(course?.id, semester?.id)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const required = reviews?.some((r) => r.attendance_required)
  const stars = '★'.repeat(Math.round(avg(reviews || [], 'professor_rating'))).padEnd(5, '☆')

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-20" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border z-30
                        p-6 overflow-y-auto" role="dialog" aria-label="Course detail">
        <button onClick={onClose} className="float-right text-muted hover:text-accent font-mono">✕</button>
        <h2 className="font-mono text-accent text-lg">{course.code}</h2>
        <p className="text-text">{course.name}</p>
        <p className="text-muted text-xs mb-4">{semester.label} · {course.faculty} / {course.department}</p>

        {loading ? <p className="text-muted font-mono text-sm">Loading…</p> : reviews?.length ? (
          <div className="space-y-4">
            <div className="text-accent font-mono">{stars} <span className="text-muted text-xs">({avg(reviews,'professor_rating').toFixed(1)})</span></div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <Stat label="Avg GPA" value={avg(reviews,'grade_points').toFixed(2)} />
              <Stat label="Workload" value={avg(reviews,'workload').toFixed(1) + ' / 5'} />
              <Stat label="Attendance" value={required ? `Required (${Math.round(avg(reviews.filter(r=>r.attendance_required),'attendance_pct'))}%)` : 'Optional'} />
              <Stat label="Reviews" value={reviews.length} />
            </div>
            <div>
              <p className="text-muted text-xs font-mono mb-2">Grade distribution</p>
              <GradeChart reviews={reviews} />
            </div>
          </div>
        ) : <p className="text-muted font-mono text-sm">No reviews for this cell.</p>}
      </aside>
    </>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-bg border border-border rounded p-2">
      <div className="text-muted">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  )
}
```

- [ ] **Step 2: Wire the drawer into `src/App.jsx`**

Add import:
```jsx
import { CourseDrawer } from './components/CourseDrawer'
```
Read the selected cell + closer from the store (extend the destructure):
```jsx
const { metric, setMetric, faculty, setFaculty, department, setDepartment, clearFilters, openCell, selectedCell, closeCell } = useAppStore()
```
Resolve the selected course/semester and render the drawer before the closing `</div>`:
```jsx
const selCourse = selectedCell && courses.find((c) => c.id === selectedCell.courseId)
const selSemester = selectedCell && semesters.find((s) => s.id === selectedCell.semesterId)
```
```jsx
<CourseDrawer course={selCourse} semester={selSemester} onClose={closeCell} />
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`. Click a populated cell.
Expected: drawer slides in with stars, avg GPA/workload/attendance, the Chart.js grade distribution, and a review count. Esc, ✕, and clicking the backdrop all close it. Console clean.

- [ ] **Step 4: Commit**

```bash
git add src/components/CourseDrawer.jsx src/App.jsx
git commit -m "feat: add course detail drawer with grade chart"
```

---

## Phase 6 — Submission (Backend Write Path)

### Task 19: SubmitReviewForm

**Files:**
- Create: `src/components/SubmitReviewForm.jsx`
- Test: `src/components/SubmitReviewForm.test.jsx`

- [ ] **Step 1: Write the failing test (client-side validation surfaces errors)**

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SubmitReviewForm } from './SubmitReviewForm'

const courses = [{ id: 'c1', code: 'SECJ3553', name: 'Network Security' }]
const semesters = [{ id: 's1', label: 'Sem 1 2023/2024' }]

describe('SubmitReviewForm', () => {
  it('shows validation errors when submitting empty required fields', () => {
    render(<SubmitReviewForm courses={courses} semesters={semesters} onSubmitted={() => {}} onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/select a course/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/SubmitReviewForm.test.jsx`
Expected: FAIL — cannot resolve `./SubmitReviewForm`.

- [ ] **Step 3: Implement `src/components/SubmitReviewForm.jsx`**

```jsx
import { useState } from 'react'
import { useSubmitReview } from '../hooks/useSubmitReview'

const blank = {
  course_id: '', semester_id: '',
  professor_rating: 3, grade_points: 3, workload: 3,
  attendance_required: false, attendance_pct: 70, notes: '',
}

export function SubmitReviewForm({ courses, semesters, onSubmitted, onClose }) {
  const [form, setForm] = useState(blank)
  const { submit, status, errors } = useSubmitReview()
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const num = 'bg-bg border border-border rounded px-2 py-1 w-full font-mono text-sm'

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await submit(form)
    if (res.ok) { onSubmitted(); setForm(blank) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30" onClick={onClose} aria-hidden />
      <form onSubmit={handleSubmit} role="dialog" aria-label="Submit review"
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-md
                       bg-surface border border-border rounded-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto">
        <h2 className="font-mono text-accent">submit_review</h2>

        <Field label="Course" error={errors.course_id}>
          <select className={num} value={form.course_id} onChange={(e) => set('course_id', e.target.value)}>
            <option value="">Select…</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
          </select>
        </Field>
        <Field label="Semester" error={errors.semester_id}>
          <select className={num} value={form.semester_id} onChange={(e) => set('semester_id', e.target.value)}>
            <option value="">Select…</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Range label={`Professor rating: ${form.professor_rating}`} min={1} max={5} step={0.5}
               value={form.professor_rating} onChange={(v) => set('professor_rating', v)} error={errors.professor_rating} />
        <Range label={`Your GPA: ${form.grade_points}`} min={0} max={4} step={0.1}
               value={form.grade_points} onChange={(v) => set('grade_points', v)} error={errors.grade_points} />
        <Range label={`Workload: ${form.workload}`} min={1} max={5} step={0.5}
               value={form.workload} onChange={(v) => set('workload', v)} error={errors.workload} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.attendance_required}
                 onChange={(e) => set('attendance_required', e.target.checked)} />
          Attendance required
        </label>
        {form.attendance_required && (
          <Field label="Attendance %" error={errors.attendance_pct}>
            <input type="number" className={num} min={0} max={100} value={form.attendance_pct}
                   onChange={(e) => set('attendance_pct', Number(e.target.value))} />
          </Field>
        )}
        <Field label="Notes (optional)" error={errors.notes}>
          <textarea className={num} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        {errors.form && <p className="text-red-400 text-xs font-mono">{errors.form}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="text-muted text-sm font-mono">cancel</button>
          <button type="submit" disabled={status === 'submitting'}
                  className="bg-accent text-bg px-4 py-1.5 rounded font-mono text-sm disabled:opacity-50">
            {status === 'submitting' ? 'submitting…' : 'submit'}
          </button>
        </div>
      </form>
    </>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-muted text-xs font-mono mb-1">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
function Range({ label, error, ...props }) {
  return (
    <div>
      <label className="block text-muted text-xs font-mono mb-1">{label}</label>
      <input type="range" className="w-full accent-[oklch(0.78_0.16_75)]"
             {...props} onChange={(e) => props.onChange(Number(e.target.value))} />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/SubmitReviewForm.test.jsx`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/SubmitReviewForm.jsx src/components/SubmitReviewForm.test.jsx
git commit -m "feat: add review submission form"
```

---

### Task 20: Wire submission into App with stats refresh

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add submission state + refresh wiring to `src/App.jsx`**

Add import:
```jsx
import { useState } from 'react'
import { SubmitReviewForm } from './components/SubmitReviewForm'
```
Add local state and pass a refresh key to `useStats`:
```jsx
const [showForm, setShowForm] = useState(false)
const [refreshKey, setRefreshKey] = useState(0)
```
Change the stats hook call to: `const { statsMap, loading: sLoading, error: sErr } = useStats(refreshKey)`

Add a "submit review" button in the header:
```jsx
<button onClick={() => setShowForm(true)}
        className="font-mono text-xs border border-accent text-accent rounded px-3 py-1.5 hover:bg-accent hover:text-bg transition">
  + submit review
</button>
```
Render the form near the drawer:
```jsx
{showForm && (
  <SubmitReviewForm
    courses={courses}
    semesters={semesters}
    onClose={() => setShowForm(false)}
    onSubmitted={() => { setShowForm(false); setRefreshKey((k) => k + 1) }}
  />
)}
```

- [ ] **Step 2: Verify the full write path in the browser**

Run: `npm run dev`. Click "+ submit review", fill valid values, submit.
Expected: form closes, and the affected cell's color/value updates after refresh (because `course_semester_stats` recomputed). Submitting with no course selected shows "Select a course". Console clean.

- [ ] **Step 3: Verify RLS actually blocks an update (manual)**

In the browser devtools console on the running app:
```js
const { supabase } = await import('/src/lib/supabase.js')
const u = await supabase.from('reviews').update({ workload: 1 }).neq('id','x')
console.log(u.error || u.data)   // expect [] (no rows updated) — RLS gives no UPDATE policy
```
Expected: no rows updated (RLS denies). Confirms write-protection beyond insert.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: wire submission form and stats refresh"
```

---

## Phase 7 — Polish, Deploy, Resume-Ready

### Task 21: Responsive + reduced-motion + error/empty states audit

**Files:**
- Modify: `src/App.jsx`, `src/index.css` (as needed)

- [ ] **Step 1: Manual responsive check**

Run `npm run dev`, open devtools responsive mode at 375px width.
Expected: header wraps, controls stack, heatmap scrolls horizontally with the sticky course column visible. Fix any overflow with Tailwind responsive classes if broken.

- [ ] **Step 2: Reduced-motion check**

In devtools → Rendering → "Emulate prefers-reduced-motion: reduce". Reload.
Expected: cells appear instantly with no fill-in animation (content fully visible).

- [ ] **Step 3: No-JS check**

Confirm `index.html` has the heatmap rendered by React only — acceptable for an SPA, but verify the page shows a meaningful `<noscript>` message. Add to `index.html` inside `<body>`:
```html
<noscript>This interactive heatmap requires JavaScript. Source & data: github.com/new2codinglol/course-review-heatmap</noscript>
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "polish: responsive, reduced-motion, noscript"
```

---

### Task 22: Deploy to Vercel

**Files:** none (config in Vercel dashboard)

- [ ] **Step 1: Run a production build locally**

Run: `npm run build`
Expected: build succeeds, `dist/` produced, no errors.

- [ ] **Step 2: Deploy**

```bash
npx vercel --prod
```
When prompted, link/create a project. In the Vercel dashboard → Settings → Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (do NOT add the service_role key). Redeploy if env was added after first deploy.

- [ ] **Step 3: Verify the live URL**

Open the deployed URL. Expected: heatmap loads from Supabase, switching/filtering/drawer/submission all work. Console clean.

- [ ] **Step 4: Commit any vercel config**

```bash
git add -A
git commit -m "chore: vercel deploy config" --allow-empty
```

---

### Task 23: README and resume bullet

**Files:**
- Create: `README.md` (replace any Vite default)

- [ ] **Step 1: Write `README.md`**

```markdown
# Course Review Heatmap

A dense, terminal-style heatmap of course reputation (professor rating, GPA, workload,
attendance) across ~25 Malaysian-university courses and 8 semesters. Students read
aggregated reputation and submit their own reviews.

**Live demo:** <vercel-url>

## Stack
React (Vite) · Tailwind (OKLCH) · Zustand · Supabase (Postgres + RLS) · Chart.js · Vercel

## How it works
- The heatmap reads an aggregated Postgres **view** (`course_semester_stats`); the detail
  drawer reads underlying `reviews` rows.
- Submissions `INSERT` into `reviews`, validated both client-side and by **CHECK constraints**,
  and governed by **Row Level Security** (anonymous read + constrained insert; no update/delete).
- Heat colors use a **colorblind-safe sequential OKLCH ramp**, and every cell prints its value.

## Data & limitations (honest notes)
- Data is **synthetic / UTM-inspired** — not real enrollment advice.
- Submissions are **anonymous and unmoderated** (no auth) — a deliberate MVP scope choice.
- The Supabase free tier may pause the project after ~7 days of inactivity; if the demo looks
  empty, it is waking up — reload after a moment.

## Local setup
1. `npm install`
2. Copy `.env.example` → `.env`, fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `supabase/schema.sql` in your Supabase SQL editor.
4. Seed: add `SUPABASE_SERVICE_ROLE_KEY` to `.env`, then `node supabase/seed.mjs`.
5. `npm run dev`
```

- [ ] **Step 2: Verify README renders and links work**

Confirm the live demo URL is filled in and the GitHub link matches the repo.

- [ ] **Step 3: Commit and push**

```bash
git add README.md
git commit -m "docs: add README with honest data/security notes"
git push
```

- [ ] **Step 4: Resume bullet (paste into your CV)**

> Built a full-stack course-review heatmap (React, Supabase/Postgres, Chart.js) visualizing
> professor ratings, GPA, workload, and attendance across ~25 courses × 8 semesters. Designed
> the schema with database-level CHECK constraints, an aggregation view, and Row Level Security
> for a validated anonymous submission flow; rendered a dense, colorblind-safe OKLCH heatmap on
> a custom CSS grid with an interactive detail drawer.

---

## Self-Review Notes (author check, not a task)

- **Spec coverage:** schema/view/RLS (T3), seed density (T5), heatmap + printed value + confidence (T12–13), metric switcher (T14), filters (T15), legend per-metric (T16), drawer + Chart.js (T17–18), submission + validation + RLS write path (T19–20), animation + reduced-motion + responsive (T12/T21), deploy + honest README (T22–23). All §-level spec items map to a task.
- **Type consistency:** `statKey` values match the view columns in T3; store method names (`setMetric`, `setFaculty`, `setDepartment`, `clearFilters`, `openCell`, `closeCell`) are consistent T9→T13/16/18; `heatColor(value, domain)` signature consistent T7→T12/16; `validateReview` shape consistent T8→T11/19.
- **Deferred §11 items resolved:** submission as a modal (T19), confidence cue via opacity (T12), keep-alive ping omitted (documented tradeoff in README instead, T23).
```
