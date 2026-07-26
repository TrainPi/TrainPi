/**
 * Course-matching orchestration: given a roadmap step's title/skills (from
 * the AI-generated roadmap in roadmap.py), find the best way to learn it.
 *
 * 1. Check the curated catalog (courseCatalog.ts) first — cheap, reliable,
 *    already has real multi-unit structure + progress tracking.
 * 2. If no curated course covers it, fall back to a live YouTube search
 *    (video.py's /api/video/search) with a tightened query — never search
 *    on the raw step title alone, which returns low-quality results.
 */
import { COURSE_CATALOG, type CatalogCourse } from './courseCatalog'
import { videoAPI } from './api'

export type CourseMatch =
  | { type: 'curated'; course: CatalogCourse }
  | { type: 'video'; video_id: string; title: string; channel: string; thumbnail: string }
  | { type: 'none' }

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim()
}

function tokenize(s: string): string[] {
  return normalize(s).split(/\s+/).filter((t) => t.length > 2)
}

/**
 * Score a curated course against a roadmap step's title + skills.
 * Counts overlapping tokens between the step and the course's title/
 * category/skills — simple, fast, no AI call needed.
 */
function scoreCourse(course: CatalogCourse, stepTitle: string, stepSkills: string[]): number {
  const stepTokens = new Set([...tokenize(stepTitle), ...stepSkills.flatMap(tokenize)])
  const courseTokens = new Set([
    ...tokenize(course.title),
    ...tokenize(course.category),
    ...course.skills.flatMap(tokenize),
  ])

  let overlap = 0
  for (const token of stepTokens) {
    if (courseTokens.has(token)) overlap++
  }
  return overlap
}

const MIN_MATCH_SCORE = 2

/**
 * Find the best curated course for a roadmap step, or null if nothing
 * scores highly enough to be a confident match.
 */
export function matchCuratedCourse(stepTitle: string, stepSkills: string[] = []): CatalogCourse | null {
  let best: { course: CatalogCourse; score: number } | null = null
  for (const course of COURSE_CATALOG) {
    const score = scoreCourse(course, stepTitle, stepSkills)
    if (score >= MIN_MATCH_SCORE && (!best || score > best.score)) {
      best = { course, score }
    }
  }
  return best?.course ?? null
}

/**
 * Full resolution: curated catalog first, live YouTube search as fallback.
 * The fallback query is tightened (not the raw step title) to avoid the
 * garbage-in-garbage-out problem of searching YouTube on a vague goal.
 */
export async function resolveCourseForStep(stepTitle: string, stepSkills: string[] = []): Promise<CourseMatch> {
  const curated = matchCuratedCourse(stepTitle, stepSkills)
  if (curated) {
    return { type: 'curated', course: curated }
  }

  try {
    const query = `${stepTitle} tutorial for beginners`
    const result = await videoAPI.search(query)
    if (result?.video_id) {
      return { type: 'video', video_id: result.video_id, title: result.title, channel: result.channel, thumbnail: result.thumbnail }
    }
  } catch {
    // fall through to 'none'
  }

  return { type: 'none' }
}
