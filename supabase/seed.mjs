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

// ~25 courses across UTM-style faculties/departments
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
