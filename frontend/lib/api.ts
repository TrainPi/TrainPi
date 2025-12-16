'use client'

import { useAuthStore } from '@/store/authStore'

interface LessonModule {
  title?: string
  content?: string
  key_takeaways?: string[]
  duration_minutes?: number
}

interface LessonRecord {
  id: number
  title: string
  modules: LessonModule[]
  quiz_questions?: any[]
  created_at?: string
}

interface DashboardProgressPayload {
  lesson_id: number
  progress_type: 'lesson' | 'career' | 'quiz'
  completion_percentage: number
  time_spent_minutes?: number
}

interface ExceptionRecord {
  id: number
  type: string
  status: string
  createdAt: string
  remarks?: string
  clearedAt?: string
  duration?: number
}

interface StoredUserData {
  lessons?: LessonRecord[]
  stats?: Record<string, number | string>
  exceptions?: ExceptionRecord[]
}

const STORAGE_PREFIX = 'trainpi-user-'
const DEFAULT_STATS: Record<string, number | string> = {
  career_path: 'Data Scientist',
  roadmap_completion: 0,
  skills_acquired: 0,
  skills_required: 0,
  courses_completed: 0,
  lessons_in_progress: 0,
  lessons_completed: 0,
}

const DEFAULT_EXCEPTIONS: ExceptionRecord[] = [
  {
    id: 1,
    type: 'ATT C',
    status: 'exception',
    createdAt: new Date().toISOString(),
    remarks: 'Attendance cancelled due to medical reasons',
  },
]

const isClient = () => typeof window !== 'undefined'

const getUserKey = () => {
  const userId = useAuthStore.getState().user?.id ?? 'guest'
  return `${STORAGE_PREFIX}${userId}`
}

const readUserData = (): StoredUserData => {
  if (!isClient()) return {}
  try {
    const raw = window.localStorage.getItem(getUserKey())
    return raw ? JSON.parse(raw) : {}
  } catch (error) {
    console.warn('Failed to parse stored user data', error)
    return {}
  }
}

const writeUserData = (data: StoredUserData) => {
  if (!isClient()) return
  try {
    window.localStorage.setItem(getUserKey(), JSON.stringify(data))
  } catch (error) {
    console.warn('Failed to persist user data', error)
  }
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
    const stats = { ...DEFAULT_STATS, ...(data.stats || {}) }

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
    const exceptions = data.exceptions || DEFAULT_EXCEPTIONS
    return exceptions.map((item) => ({ ...item }))
  },

  async clearException(id: number): Promise<void> {
    await delay()
    const data = readUserData()
    const now = new Date().toISOString()
    const exceptions = (data.exceptions || DEFAULT_EXCEPTIONS).map((item) => {
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
