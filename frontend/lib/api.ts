
'use client'

import { useAuthStore } from '@/store/authStore'
import type { CourseStatus, LearningPlan, PlanCourse } from './plan'

export interface LessonModule {
  title?: string
  content?: string
  key_takeaways?: string[]
  duration_minutes?: number
}

export interface LessonRecord {
  id: number
  title: string
  modules: LessonModule[]
  quiz_questions?: any[]
  created_at?: string
}

export interface DashboardProgressPayload {
  lesson_id: number
  progress_type: 'lesson' | 'career' | 'quiz' | 'course'
  completion_percentage: number
  time_spent_minutes?: number
}

export interface ExceptionRecord {
  id: number
  type: string
  status: string
  createdAt: string
  remarks?: string
  clearedAt?: string
  duration?: number
}

export interface UserProfileSnapshot {
  interests?: string[]
  skills?: string[]
  career_path?: string
  strengths?: string[]
}
export interface JobApplication {
  id: string
  company: string
  role: string
  stage: 'Applied' | 'Interviewing' | 'Offer' | 'Rejected'
  appliedAt: string
  nextStep?: string
  notes?: string
}

export interface MentorSession {
  id: string
  mentor: string
  topic: string
  scheduledAt: string
  status: 'Scheduled' | 'Completed'
  format: 'Virtual' | 'In-person'
}

export interface ClassEvent {
  id: string
  title: string
  instructor: string
  startsAt: string
  format: 'Live' | 'Workshop' | 'Cohort'
  location?: string
}

export interface StoredUserData {
  lessons?: LessonRecord[]
  stats?: Record<string, number | string>
  exceptions?: ExceptionRecord[]
  profile?: UserProfileSnapshot
  plan?: LearningPlan
  courses?: PlanCourse[]
  jobApplications?: JobApplication[]
  mentorSessions?: MentorSession[]
  upcomingClasses?: ClassEvent[]
}
export const STORAGE_PREFIX = 'trainpi-user-'

export const DEFAULT_STATS: Record<string, number | string> = {
  career_path: 'Data Scientist',
  roadmap_completion: 0,
  skills_acquired: 0,
  skills_required: 0,
  courses_completed: 0,
  lessons_in_progress: 0,
  lessons_completed: 0,
  next_milestone: '',
  active_phase: '',
  jobs_applied: 0,
  interviews_scheduled: 0,
  mentor_sessions: 0,
  upcoming_class: 'No classes scheduled',
  next_session: 'No mentor session scheduled',
}

export const DEFAULT_EXCEPTIONS: ExceptionRecord[] = [
  {
    id: 1,
    type: 'ATT C',
    status: 'exception',
    createdAt: new Date().toISOString(),
    remarks: 'Attendance cancelled due to medical reasons',
  },
]

const DEFAULT_JOB_APPLICATIONS: JobApplication[] = [
  {
    id: 'job-1',
    company: 'Acme Labs',
    role: 'Junior Full Stack Developer',
    stage: 'Interviewing',
    appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    nextStep: 'Technical interview scheduled for next week',
  },
  {
    id: 'job-2',
    company: 'DataVerse',
    role: 'Product Data Analyst',
    stage: 'Applied',
    appliedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    nextStep: 'Awaiting recruiter response',
  },
]

const DEFAULT_MENTOR_SESSIONS: MentorSession[] = [
  {
    id: 'mentor-1',
    mentor: 'Alicia Gomez',
    topic: 'Portfolio storytelling',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Scheduled',
    format: 'Virtual',
  },
  {
    id: 'mentor-2',
    mentor: 'David Kim',
    topic: 'Mock system design interview',
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Completed',
    format: 'Virtual',
  },
]

const DEFAULT_CLASSES: ClassEvent[] = [
  {
    id: 'class-1',
    title: 'Live React Lab: Component Patterns',
    instructor: 'Coach Ben',
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    format: 'Live',
    location: 'Online',
  },
  {
    id: 'class-2',
    title: 'Career Studio: Interview Pitching',
    instructor: 'Coach Priya',
    startsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    format: 'Workshop',
    location: 'Campus Hub',
  },
]

export const isClient = () => typeof window !== 'undefined'

export const getUserStorageKey = () => {
  const userId = useAuthStore.getState().user?.id ?? 'guest'
  return `${STORAGE_PREFIX}${userId}`
}

const cloneExceptions = (exceptions?: ExceptionRecord[]) => {
  return (exceptions && exceptions.length > 0 ? exceptions : DEFAULT_EXCEPTIONS).map((item, index) => ({
    ...item,
    id: item.id ?? index + 1,
  }))
}

const mergeStats = (stats?: Record<string, number | string>) => ({
  ...DEFAULT_STATS,
  ...(stats || {}),
})

const ensureJobApplications = (applications?: JobApplication[]) => {
  const base = applications && applications.length > 0 ? applications : DEFAULT_JOB_APPLICATIONS
  return base.map((application, index) => ({
    ...application,
    id: application.id || `job-${index + 1}`,
  }))
}

const ensureMentorSessions = (sessions?: MentorSession[]) => {
  const base = sessions && sessions.length > 0 ? sessions : DEFAULT_MENTOR_SESSIONS
  return base.map((session, index) => ({
    ...session,
    id: session.id || `mentor-${index + 1}`,
  }))
}

const ensureUpcomingClasses = (classes?: ClassEvent[]) => {
  const base = classes && classes.length > 0 ? classes : DEFAULT_CLASSES
  return base.map((event, index) => ({
    ...event,
    id: event.id || `class-${index + 1}`,
  }))
}

const findActivePhase = (plan?: LearningPlan, courses: PlanCourse[] = []) => {
  if (!plan) {
    return undefined
  }
  for (const phase of plan.phases) {
    const relevantCourses = courses.filter((course) =>
      phase.focus.some((focusSkill) =>
        course.focus.some((courseSkill) => courseSkill.toLowerCase() === focusSkill.toLowerCase())
      )
    )
    if (relevantCourses.length === 0) {
      return phase
    }
    const allCompleted = relevantCourses.every((course) => course.status === 'completed')
    if (!allCompleted) {
      return phase
    }
  }
  return plan.phases[plan.phases.length - 1]
}
const syncPlanMetrics = (data: StoredUserData): StoredUserData => {
  const mergedStats = mergeStats(data.stats)
  const plan = data.plan
  const courses = plan?.courses ?? data.courses ?? []
  const jobApplications = ensureJobApplications(data.jobApplications)
  const mentorSessions = ensureMentorSessions(data.mentorSessions)
  const upcomingClasses = ensureUpcomingClasses(data.upcomingClasses)

  if (plan) {
    const completed = courses.filter((course) => course.status === 'completed').length
    const inProgress = courses.filter((course) => course.status === 'in_progress').length
    const total = courses.length

    mergedStats.career_path = plan.careerPath
    mergedStats.courses_completed = completed
    mergedStats.lessons_in_progress = inProgress
    mergedStats.skills_required = plan.focusSkills?.length ?? mergedStats.skills_required
    const required = Number(mergedStats.skills_required) || 0
    mergedStats.skills_acquired = Math.min(required, completed)
    if (total > 0) {
      mergedStats.roadmap_completion = Math.min(100, Math.round((completed / total) * 100))
    }

    const activePhase = findActivePhase(plan, courses)
    if (activePhase) {
      mergedStats.active_phase = activePhase.title
      mergedStats.next_milestone = activePhase.milestone
    } else {
      mergedStats.active_phase = plan.phases[0]?.title ?? mergedStats.active_phase
      mergedStats.next_milestone = plan.phases[0]?.milestone ?? mergedStats.next_milestone
    }
  }

  mergedStats.jobs_applied = jobApplications.length
  mergedStats.interviews_scheduled = jobApplications.filter((application) =>
    application.stage === 'Interviewing' || application.stage === 'Offer'
  ).length
  const upcomingMentor = mentorSessions.find((session) => session.status === 'Scheduled')
  mergedStats.mentor_sessions = mentorSessions.filter((session) => session.status === 'Completed').length
  mergedStats.next_session = upcomingMentor?.scheduledAt ?? DEFAULT_STATS.next_session
  mergedStats.upcoming_class = upcomingClasses[0]?.title ?? DEFAULT_STATS.upcoming_class

  return {
    ...data,
    stats: mergedStats,
    exceptions: cloneExceptions(data.exceptions),
    plan,
    courses,
    jobApplications,
    mentorSessions,
    upcomingClasses,
  }
}
export const readUserData = (): StoredUserData => {
  if (!isClient()) {
    return syncPlanMetrics({})
  }
  try {
    const raw = window.localStorage.getItem(getUserStorageKey())
    const parsed: StoredUserData = raw ? JSON.parse(raw) : {}
    return syncPlanMetrics(parsed)
  } catch (error) {
    console.warn('Failed to parse stored user data', error)
    return syncPlanMetrics({})
  }
}

export const writeUserData = (data: StoredUserData): StoredUserData => {
  const sanitized = syncPlanMetrics(data)
  if (!isClient()) {
    return sanitized
  }
  try {
    window.localStorage.setItem(getUserStorageKey(), JSON.stringify(sanitized))
  } catch (error) {
    console.warn('Failed to persist user data', error)
  }
  return sanitized
}
export const savePlanSnapshot = (
  plan: LearningPlan,
  profile?: UserProfileSnapshot
): StoredUserData => {
  const snapshot = readUserData()
  const updated: StoredUserData = {
    ...snapshot,
    plan,
    profile: {
      interests: profile?.interests ?? snapshot.profile?.interests ?? [],
      skills: profile?.skills ?? snapshot.profile?.skills ?? [],
      career_path: profile?.career_path ?? plan.careerPath,
      strengths: profile?.strengths ?? snapshot.profile?.strengths ?? [],
    },
    stats: {
      ...mergeStats(snapshot.stats),
      career_path: plan.careerPath,
    },
    courses: plan.courses,
    jobApplications: snapshot.jobApplications,
    mentorSessions: snapshot.mentorSessions,
    upcomingClasses: snapshot.upcomingClasses,
  }
  return writeUserData(updated)
}
export const updateCourseStatus = (
  courseId: string,
  status: CourseStatus
): StoredUserData => {
  const snapshot = readUserData()
  if (!snapshot.plan) {
    return snapshot
  }
  const updatedPlan: LearningPlan = {
    ...snapshot.plan,
    courses: snapshot.plan.courses.map((course) =>
      course.id === courseId ? { ...course, status } : course
    ),
  }
  return writeUserData({
    ...snapshot,
    plan: updatedPlan,
    courses: updatedPlan.courses,
  })
}
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export const lessonsAPI = {
  async listLessons(): Promise<LessonRecord[]> {
    await delay()
    const data = readUserData()
    return data.lessons || []
  },

  async getLesson(id: number): Promise<LessonRecord> {
    await delay()
    const data = readUserData()
    const lesson = (data.lessons || []).find((item) => item.id === id)
    if (!lesson) {
      throw new Error('Lesson not found')
    }
    return lesson
  },

  async upsertLesson(lesson: LessonRecord): Promise<void> {
    await delay()
    const data = readUserData()
    const lessons = data.lessons || []
    const index = lessons.findIndex((item) => item.id === lesson.id)
    if (index >= 0) {
      lessons[index] = lesson
    } else {
      lessons.push(lesson)
    }
    data.lessons = lessons
    writeUserData(data)
  },
}
export const dashboardAPI = {
  async updateProgress(payload: DashboardProgressPayload): Promise<void> {
    await delay()
    const data = readUserData()
    const stats = mergeStats(data.stats)

    if (payload.progress_type === 'lesson') {
      const completion = Math.max(0, Math.min(100, Math.round(payload.completion_percentage)))
      stats.lessons_in_progress = completion < 100 ? 1 : 0
      if (completion >= 100) {
        const completed = Number(stats.lessons_completed) || 0
        stats.lessons_completed = completed + 1
      }
      const currentRoadmap = Number(stats.roadmap_completion) || 0
      stats.roadmap_completion = Math.max(currentRoadmap, completion)
      const acquired = Number(stats.skills_acquired) || 0
      stats.skills_acquired = completion >= 100 ? acquired + 1 : acquired
    }

    data.stats = stats
    writeUserData(data)
  },
}
export const exceptionsAPI = {
  async getExceptions(): Promise<ExceptionRecord[]> {
    await delay()
    const data = readUserData()
    return cloneExceptions(data.exceptions)
  },

  async clearException(id: number): Promise<void> {
    await delay()
    const data = readUserData()
    const now = new Date().toISOString()
    const exceptions = cloneExceptions(data.exceptions).map((item) => {
      if (item.id === id) {
        const created = new Date(item.createdAt)
        const cleared = new Date(now)
        const durationSeconds = Math.max(0, Math.floor((cleared.getTime() - created.getTime()) / 1000))
        return {
          ...item,
          status: 'cleared',
          clearedAt: now,
          duration: durationSeconds,
        }
      }
      return item
    })
    data.exceptions = exceptions
    writeUserData(data)
  },
}








