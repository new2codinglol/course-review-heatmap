-- Course Review Heatmap — schema, aggregation view, and RLS
-- Run this once in the Supabase SQL editor (or via psql / a direct connection).

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
  avg(professor_rating)::numeric(3,2)                 as avg_rating,
  avg(grade_points)::numeric(3,2)                     as avg_gpa,
  avg(workload)::numeric(3,2)                         as avg_workload,
  (avg(attendance_required::int) * 100)::numeric(5,1) as pct_attendance_required,
  count(*)                                            as sample_size
from reviews
group by course_id, semester_id;

-- Row Level Security
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
