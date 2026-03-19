export type RoadmapResourceLike = {
  name?: string
  url?: string | null
}

export type RoadmapStepLike = {
  step_number?: number
  title?: string
  description?: string
  skills?: string[]
  estimated_time?: string
  resources?: RoadmapResourceLike[]
}

const COURSE_LESSON_STORAGE_KEY = 'trainpi-course-lesson-map'

type LessonMap = Record<string, number>

function getStorageKey(roadmapId: number, stepNumber: number) {
  return `${roadmapId}:${stepNumber}`
}

function readLessonMap(): LessonMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(COURSE_LESSON_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeLessonMap(value: LessonMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COURSE_LESSON_STORAGE_KEY, JSON.stringify(value))
}

export function getRoadmapLessonId(roadmapId: number, stepNumber: number): number | null {
  const value = readLessonMap()[getStorageKey(roadmapId, stepNumber)]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function setRoadmapLessonId(roadmapId: number, stepNumber: number, lessonId: number) {
  const next = readLessonMap()
  next[getStorageKey(roadmapId, stepNumber)] = lessonId
  writeLessonMap(next)
}

export function getReferenceSources(step: RoadmapStepLike | null | undefined): string[] {
  if (!Array.isArray(step?.resources)) return []

  const seen = new Set<string>()
  const names: string[] = []

  for (const resource of step.resources) {
    const name = String(resource?.name || '').trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }

  return names
}

export function buildTrainPiLessonTopic(careerPath: string, step: RoadmapStepLike | null | undefined) {
  const title = String(step?.title || 'Guided lesson').trim()
  const description = String(step?.description || '').trim()
  const skills = Array.isArray(step?.skills) ? step.skills.filter(Boolean).join(', ') : ''
  const references = getReferenceSources(step).slice(0, 3).join(', ')
  const estimatedTime = String(step?.estimated_time || '').trim()

  return [
    `Create a guided TrainPi lesson for a learner pursuing ${careerPath}.`,
    `Lesson topic: ${title}.`,
    description ? `Focus: ${description}` : '',
    skills ? `Key skills to teach: ${skills}.` : '',
    estimatedTime ? `Target study time: ${estimatedTime}.` : '',
    references ? `Use these sources only as reference context, but keep the lesson fully self-contained inside TrainPi: ${references}.` : '',
    'Return clear module explanations, practical examples, and a short quiz. Do not tell the learner to leave TrainPi or visit external sites.'
  ]
    .filter(Boolean)
    .join(' ')
}
