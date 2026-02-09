/**
 * Static demo data for the full application flow (client demo / mock mode).
 * Every operation displays relevant data when backend is disconnected.
 */

export const DEMO_CAREERS = [
  { id: 'Software Engineer', description: 'Learn coding and build applications', skills: ['React', 'Python', 'System Design'] },
  { id: 'Data Analyst', description: 'Master data analysis and visualization', skills: ['SQL', 'Tableau', 'Statistics'] },
  { id: 'AI Engineer', description: 'Specialize in AI and machine learning', skills: ['TensorFlow', 'NLP', 'Computer Vision'] },
  { id: 'IT Specialist', description: 'Develop skills in IT support & cybersecurity', skills: ['Networks', 'Security', 'Cloud'] },
] as const

export const DEMO_WEEKLY_GOALS = [2, 3, 5] as const

/** Base stats when no career selected (for first-time demo) */
export const DEMO_STATS = {
  career_path: null as string | null,
  roadmap_completion: 0,
  skills_acquired: 0,
  skills_required: 10,
  courses_enrolled: 0,
  courses_completed: 0,
  lessons_in_progress: 0,
  lessons_completed: 0,
  resume_score: null as number | null,
  last_resume_update: null as string | null,
  weekly_goals: [
    'Complete career discovery',
    'Set a weekly goal',
    'Start your first lesson',
  ],
  suggested_next_steps: [
    'Complete career discovery to find your path',
    'Set a weekly goal',
    'Start your first learning module',
  ],
  exceptions: [] as any[],
}

/**
 * Rich demo stats when career is selected — makes dashboard and job-readiness look active.
 */
export function getDemoStatsWithSelections(careerPath: string | null, weeklyGoal: number) {
  const hasCareer = !!careerPath
  return {
    ...DEMO_STATS,
    career_path: careerPath,
    roadmap_completion: hasCareer ? 85 : 0,
    skills_acquired: hasCareer ? 5 : 0,
    skills_required: 10,
    courses_enrolled: hasCareer ? 2 : 0,
    courses_completed: hasCareer ? 1 : 0,
    lessons_in_progress: hasCareer ? 2 : 0,
    lessons_completed: hasCareer ? 8 : 0,
    resume_score: hasCareer ? 78 : null,
    last_resume_update: hasCareer ? '2025-01-15' : null,
    weekly_goals: [
      `Complete ${weeklyGoal} lessons this week`,
      'Update career profile',
      'Finish next roadmap step',
    ],
    suggested_next_steps: hasCareer
      ? [
          `Continue with step 2 of your ${careerPath} roadmap`,
          'Complete "React Fundamentals" lesson',
          'Try a Practice Problem',
        ]
      : DEMO_STATS.suggested_next_steps,
    exceptions: hasCareer ? getDemoExceptions() : [],
  }
}

/** Demo exceptions for Exceptions page and dashboard (client demo) */
export function getDemoExceptions() {
  const now = new Date()
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
  return [
    {
      id: 1,
      type: 'Training',
      status: 'exception',
      createdAt: twoDaysAgo.toISOString(),
      created_at: twoDaysAgo.toISOString(),
      remarks: 'Pending completion of safety module.',
      duration_seconds: null as number | null,
      clearedAt: undefined as string | undefined,
    },
    {
      id: 2,
      type: 'Compliance',
      status: 'exception',
      createdAt: oneDayAgo.toISOString(),
      created_at: oneDayAgo.toISOString(),
      remarks: 'Awaiting manager approval.',
      duration_seconds: null,
      clearedAt: undefined,
    },
  ]
}

export const DEMO_ROADMAP_STEPS = [
  'Fundamentals & core concepts',
  'Hands-on projects',
  'Specialization track',
  'Portfolio & job readiness',
]

/** Full step objects for roadmap view (client demo) */
export const DEMO_ROADMAP_STEPS_FULL = DEMO_ROADMAP_STEPS.map((title, i) => ({
  step_number: i + 1,
  title,
  description: i === 0
    ? 'Master the core concepts and terminology of your chosen path.'
    : i === 1
      ? 'Build 2–3 projects to apply your skills.'
      : i === 2
        ? 'Deepen expertise in one specialization area.'
        : 'Polish resume, portfolio, and interview skills.',
  skills: [] as string[],
  resources: [] as { name: string; url: string }[],
  estimated_time: i === 0 ? '2–4 weeks' : i === 1 ? '4–6 weeks' : i === 2 ? '4–8 weeks' : '2–4 weeks',
}))

/** Demo resumes for profile/job-readiness (mock) */
export const DEMO_RESUMES = [
  {
    id: 1,
    filename: 'John_Doe_Resume.pdf',
    url: '/uploads/demo-resume.pdf',
    created_at: '2025-01-15',
    score: 78,
  },
]
