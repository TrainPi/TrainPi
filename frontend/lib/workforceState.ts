/**
 * Workforce Readiness flow — shared client state persisted to localStorage.
 *
 * Powers the 5-step assessment:
 *  1. Participant Profile        (/workforce/profile)
 *  2. Operational Context        (/workforce/operational-context)
 *  3. Analysis & Comparison      (/workforce/analysis-comparison)
 *  4. Results & Insights         (/workforce/results-insights)
 *  5. Roadmap & Pathway          (/workforce/roadmap-pathway)
 *
 * Values entered in Step 1 + 2 are read back in Steps 3-5 so the mock feels real.
 */

export type ParticipantProfile = {
  current_job_title: string
  years_experience: string
  primary_skills: string[]
  additional_notes: string
  resume_filename: string | null
  resume_size_kb: number | null
  uploaded_at: string | null
}

export type DocumentCategory =
  | 'sop'
  | 'workflow'
  | 'role'
  | 'mission'
  | 'skill_framework'
  | 'other'

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  sop: 'SOPs & Policies',
  workflow: 'Workflows & Processes',
  role: 'Role Descriptions',
  mission: 'Mission & Objectives',
  skill_framework: 'Skill Frameworks',
  other: 'Other Supporting Docs',
}

export type OperationalDocument = {
  id: string
  name: string
  category: DocumentCategory
  size_kb: number
  uploaded_at: string
}

const PROFILE_KEY = 'trainpi_workforce_profile'
const CONTEXT_KEY = 'trainpi_workforce_context'
const STEP_KEY = 'trainpi_workforce_step'

const EMPTY_PROFILE: ParticipantProfile = {
  current_job_title: '',
  years_experience: '',
  primary_skills: [],
  additional_notes: '',
  resume_filename: null,
  resume_size_kb: null,
  uploaded_at: null,
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Profile
// ──────────────────────────────────────────────────────────────────────────

export function getProfile(): ParticipantProfile {
  if (typeof window === 'undefined') return EMPTY_PROFILE
  return safeParse<ParticipantProfile>(localStorage.getItem(PROFILE_KEY), EMPTY_PROFILE)
}

export function saveProfile(p: ParticipantProfile) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}

export function hasProfile(): boolean {
  const p = getProfile()
  return !!(p.current_job_title || p.primary_skills.length > 0 || p.resume_filename)
}

// ──────────────────────────────────────────────────────────────────────────
// Operational context
// ──────────────────────────────────────────────────────────────────────────

export function getDocuments(): OperationalDocument[] {
  if (typeof window === 'undefined') return []
  return safeParse<OperationalDocument[]>(localStorage.getItem(CONTEXT_KEY), [])
}

export function addDocument(doc: OperationalDocument) {
  const existing = getDocuments()
  existing.push(doc)
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(existing))
  }
}

export function removeDocument(id: string) {
  const filtered = getDocuments().filter((d) => d.id !== id)
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONTEXT_KEY, JSON.stringify(filtered))
  }
}

export function clearDocuments() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CONTEXT_KEY)
  }
}

export function documentsByCategory(): Record<DocumentCategory, OperationalDocument[]> {
  const out: Record<DocumentCategory, OperationalDocument[]> = {
    sop: [],
    workflow: [],
    role: [],
    mission: [],
    skill_framework: [],
    other: [],
  }
  for (const d of getDocuments()) {
    out[d.category].push(d)
  }
  return out
}

// ──────────────────────────────────────────────────────────────────────────
// Step tracking
// ──────────────────────────────────────────────────────────────────────────

export function getCurrentStep(): number {
  if (typeof window === 'undefined') return 1
  const raw = localStorage.getItem(STEP_KEY)
  const n = raw ? Number(raw) : 1
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 1
}

export function setCurrentStep(n: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STEP_KEY, String(n))
}

export function resetWorkforce() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(CONTEXT_KEY)
  localStorage.removeItem(STEP_KEY)
}

// ──────────────────────────────────────────────────────────────────────────
// Step metadata
// ──────────────────────────────────────────────────────────────────────────

export const STEPS = [
  { number: 1, key: 'profile', label: 'Participant Profile', href: '/workforce/profile' },
  { number: 2, key: 'context', label: 'Operational Context', href: '/workforce/operational-context' },
  { number: 3, key: 'analysis', label: 'Analysis & Comparison', href: '/workforce/analysis-comparison' },
  { number: 4, key: 'results', label: 'Results & Insights', href: '/workforce/results-insights' },
  { number: 5, key: 'roadmap', label: 'Roadmap & Pathway', href: '/workforce/roadmap-pathway' },
] as const

export type StepKey = (typeof STEPS)[number]['key']
