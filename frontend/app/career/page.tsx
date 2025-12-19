'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { buildLearningPlan } from '@/lib/plan'
import type { LearningPlan } from '@/lib/plan'
import { savePlanSnapshot, readUserData } from '@/lib/api'
import { LearningPlanSummary } from '@/components/LearningPlanSummary'

type CareerMatch = {
  career_path: string
  match_score: number
  salary_range: string
  growth_outlook: string
  required_skills: string[]
  summary: string
  plan_key: string
}

type CareerBlueprint = Omit<CareerMatch, 'match_score'> & {
  interest_tags: string[]
}

const INTEREST_OPTIONS = [
  'Technology',
  'Design',
  'Marketing',
  'Data Analysis',
  'Project Management',
  'Engineering',
  'Graphic Design',
  'Customer Support',
  'Cybersecurity',
  'Software Development',
]

const SKILL_OPTIONS = [
  'Programming',
  'UI/UX',
  'SEO',
  'Data Analysis',
  'Web Development',
  'Cloud Computing',
  'Network Security',
]

const CAREER_BLUEPRINTS: CareerBlueprint[] = [
  {
    career_path: 'Full Stack Developer',
    salary_range: '$80k - $140k',
    growth_outlook: 'Strong demand across startups and enterprises.',
    required_skills: ['Programming', 'Web Development', 'Cloud Computing', 'Data Analysis'],
    summary: 'Own the full product lifecycle, from front-end polish to resilient back-end services.',
    plan_key: 'Full Stack Developer',
    interest_tags: ['Technology', 'Software Development', 'Engineering'],
  },
  {
    career_path: 'Data Scientist',
    salary_range: '$90k - $150k',
    growth_outlook: 'Rapid growth as organisations lean on data-driven decisions.',
    required_skills: ['Data Analysis', 'Programming', 'Statistics', 'Machine Learning'],
    summary: 'Blend analytics, experimentation, and storytelling to steer strategic choices.',
    plan_key: 'Data Scientist',
    interest_tags: ['Data Analysis', 'Technology', 'Project Management'],
  },
  {
    career_path: 'UI/UX Designer',
    salary_range: '$70k - $120k',
    growth_outlook: 'Consistent demand for research-led digital product designers.',
    required_skills: ['UI/UX', 'Graphic Design', 'Accessibility', 'Prototyping'],
    summary: 'Research, prototype, and launch intuitive experiences with cross-functional teams.',
    plan_key: 'UI/UX Designer',
    interest_tags: ['Design', 'Marketing', 'Customer Support'],
  },
]

const normalizeValue = (value: string) => value.trim().toLowerCase()

const upsertValue = (list: string[], value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return list
  }
  const normalized = normalizeValue(trimmed)
  if (list.some((item) => normalizeValue(item) === normalized)) {
    return list
  }
  return [...list, trimmed]
}

const scoreBlueprint = (
  blueprint: CareerBlueprint,
  selectedInterests: string[],
  selectedSkills: string[]
) => {
  const interestMatches = blueprint.interest_tags.filter((tag) =>
    selectedInterests.some((value) => normalizeValue(value) === normalizeValue(tag))
  ).length
  const skillMatches = blueprint.required_skills.filter((skill) =>
    selectedSkills.some((value) => normalizeValue(value) === normalizeValue(skill))
  ).length

  const interestCoverage = interestMatches / Math.max(1, blueprint.interest_tags.length)
  const skillCoverage = skillMatches / Math.max(1, blueprint.required_skills.length)
  const rawScore =
    35 +
    interestCoverage * 35 +
    skillCoverage * 40 +
    (skillMatches > 0 ? 5 : 0) +
    (skillMatches === blueprint.required_skills.length && skillMatches > 0 ? 5 : 0)

  return {
    score: Math.min(100, Math.max(35, Math.round(rawScore))),
    interestMatches,
    skillMatches,
  }
}

const buildCareerMatches = (selectedInterests: string[], selectedSkills: string[]): CareerMatch[] => {
  const matches = CAREER_BLUEPRINTS
    .map((blueprint) => {
      const { score, interestMatches, skillMatches } = scoreBlueprint(
        blueprint,
        selectedInterests,
        selectedSkills
      )
      if (interestMatches === 0 && skillMatches === 0) {
        return null
      }
      return {
        career_path: blueprint.career_path,
        salary_range: blueprint.salary_range,
        growth_outlook: blueprint.growth_outlook,
        required_skills: blueprint.required_skills,
        summary: blueprint.summary,
        plan_key: blueprint.plan_key,
        match_score: score,
      }
    })
    .filter((item): item is CareerMatch => Boolean(item))
    .sort((a, b) => b.match_score - a.match_score)

  if (matches.length > 0) {
    return matches
  }

  return CAREER_BLUEPRINTS.slice(0, 2).map((blueprint, index) => ({
    career_path: blueprint.career_path,
    salary_range: blueprint.salary_range,
    growth_outlook: blueprint.growth_outlook,
    required_skills: blueprint.required_skills,
    summary: blueprint.summary,
    plan_key: blueprint.plan_key,
    match_score: 40 - index * 5,
  }))
}

export default function CareerPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')
  const [customSkill, setCustomSkill] = useState('')
  const [loading, setLoading] = useState(false)
  const [matches, setMatches] = useState<CareerMatch[]>([])
  const [showResults, setShowResults] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [planPreview, setPlanPreview] = useState<LearningPlan | null>(null)
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    const snapshot = readUserData()
    const storedInterests = snapshot.profile?.interests ?? []
    const storedSkills = snapshot.profile?.skills ?? []
    const storedCareerPath = snapshot.profile?.career_path ?? null

    setInterests(storedInterests)
    setSkills(storedSkills)

    if (storedCareerPath) {
      setSelectedCareer(storedCareerPath)
    }

    if (storedInterests.length > 0 || storedSkills.length > 0) {
      const storedMatches = buildCareerMatches(storedInterests, storedSkills)
      setMatches(storedMatches)
      if (storedMatches.length > 0) {
        setShowResults(true)
      }
    }

    if (snapshot.plan) {
      setPlanPreview(snapshot.plan)
      setSelectedCareer(snapshot.plan.careerPath)
      setShowResults(true)
    }
  }, [isAuthenticated, router])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const hasSelections = interests.length > 0 || skills.length > 0

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      const normalized = normalizeValue(interest)
      const exists = prev.some((item) => normalizeValue(item) === normalized)
      if (exists) {
        return prev.filter((item) => normalizeValue(item) !== normalized)
      }
      return [...prev, interest]
    })
  }

  const toggleSkill = (skill: string) => {
    setSkills((prev) => {
      const normalized = normalizeValue(skill)
      const exists = prev.some((item) => normalizeValue(item) === normalized)
      if (exists) {
        return prev.filter((item) => normalizeValue(item) !== normalized)
      }
      return [...prev, skill]
    })
  }

  const handleAddInterest = () => {
    const value = customInterest.trim()
    if (!value) {
      toast.error('Enter an interest first')
      return
    }
    const updated = upsertValue(interests, value)
    if (updated.length === interests.length) {
      toast.error('Interest already added')
      return
    }
    setInterests(updated)
    setCustomInterest('')
  }

  const handleAddSkill = () => {
    const value = customSkill.trim()
    if (!value) {
      toast.error('Enter a skill first')
      return
    }
    const updated = upsertValue(skills, value)
    if (updated.length === skills.length) {
      toast.error('Skill already added')
      return
    }
    setSkills(updated)
    setCustomSkill('')
  }

  const handleDiscover = () => {
    if (!hasSelections) {
      toast.error('Select at least one interest or skill before continuing')
      return
    }
    setLoading(true)
    setShowResults(true)
    setSelectedCareer(null)
    setPlanPreview(null)

    setTimeout(() => {
      const results = buildCareerMatches(interests, skills)
      setMatches(results)
      setLoading(false)
      if (results.length > 0) {
        toast.success('Career matches refreshed')
      } else {
        toast('We will keep researching personalised matches')
      }
    }, 400)
  }

  const handlePreviewPlan = (match: CareerMatch) => {
    const plan = buildLearningPlan(match.plan_key, interests, skills)
    setPlanPreview(plan)
    setSelectedCareer(match.career_path)
  }

  const handleSavePlan = () => {
    if (!planPreview) {
      return
    }
    const snapshot = savePlanSnapshot(planPreview, {
      interests,
      skills,
      career_path: planPreview.careerPath,
    })
    if (snapshot.plan) {
      setPlanPreview(snapshot.plan)
    }
    toast.success('Plan saved to your dashboard')
  }

  const handleCoursesChange = (courses: LearningPlan['courses']) => {
    setPlanPreview((previous) => (previous ? { ...previous, courses } : previous))
  }

  const handleReset = () => {
    setShowResults(false)
    setSelectedCareer(null)
    setPlanPreview(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Career explorer</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
              Dashboard
            </Link>
            <Link href="/learn" className="text-indigo-600 hover:text-indigo-500">
              Learning
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[2fr,3fr]">
        <section className="space-y-8">
          <div className="card-modern p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Step 1</p>
              <h1 className="text-2xl font-bold text-gray-900">Choose interests</h1>
              <p className="text-sm text-gray-600">Pick the topics that energise you. It is fine to mix multiple areas.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => {
                const isActive = interests.some((item) => normalizeValue(item) === normalizeValue(interest))
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={customInterest}
                onChange={(event) => setCustomInterest(event.target.value)}
                placeholder="Add your own interest"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Add interest
              </button>
            </div>
          </div>

          <div className="card-modern p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Step 2</p>
              <h2 className="text-2xl font-bold text-gray-900">Highlight skills</h2>
              <p className="text-sm text-gray-600">Mark the skills you already have or plan to develop soon.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => {
                const isActive = skills.some((item) => normalizeValue(item) === normalizeValue(skill))
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={customSkill}
                onChange={(event) => setCustomSkill(event.target.value)}
                placeholder="Add your own skill"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Add skill
              </button>
            </div>
          </div>

          <div className="card-modern p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Step 3</p>
              <h2 className="text-2xl font-bold text-gray-900">Review selections</h2>
              <p className="text-sm text-gray-600">Toggle any chip to remove it. We suggest choosing three or more combined.</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Interests</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:border-red-300 hover:text-red-500"
                    >
                      {interest}
                      <span className="ml-2 text-xs">x</span>
                    </button>
                  ))}
                  {interests.length === 0 && (
                    <span className="text-sm text-gray-400">No interests selected yet.</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skills</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700 hover:border-red-300 hover:text-red-500"
                    >
                      {skill}
                      <span className="ml-2 text-xs">x</span>
                    </button>
                  ))}
                  {skills.length === 0 && (
                    <span className="text-sm text-gray-400">No skills selected yet.</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDiscover}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={loading}
            >
              {loading ? 'Finding matches...' : 'Discover career paths'}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Career matches</h2>
              <p className="mt-1 text-sm text-gray-600">Preview a personalised plan for any path that stands out.</p>
            </div>
            {showResults && (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
              >
                Back to selection
              </button>
            )}
          </div>

          {!showResults && (
            <div className="card-modern p-6 text-gray-600">
              <p className="text-sm">
                Choose a few interests and skills to unlock tailored career suggestions. We will generate a learning roadmap you can save to your dashboard once you pick a path.
              </p>
            </div>
          )}

          {showResults && (
            <div className="space-y-6">
              {matches.map((match) => {
                const isSelected = selectedCareer === match.career_path
                return (
                  <div
                    key={match.career_path}
                    className={`card-modern border p-6 transition ${
                      isSelected ? 'border-indigo-400 shadow-lg shadow-indigo-100' : 'border-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                          Match score {match.match_score}%
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-gray-900">{match.career_path}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-800">{match.salary_range}</div>
                        <div className="text-xs text-gray-500">Typical salary band</div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{match.summary}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      {match.required_skills.map((skill) => (
                        <span
                          key={`${match.career_path}-${skill}`}
                          className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                      <span>{match.growth_outlook}</span>
                      <button
                        type="button"
                        onClick={() => handlePreviewPlan(match)}
                        className={`rounded-lg px-4 py-2 font-semibold transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                            : 'border border-indigo-200 bg-white text-indigo-600 hover:border-indigo-400 hover:text-indigo-700'
                        }`}
                      >
                        {isSelected ? 'Plan selected' : 'Preview learning plan'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {planPreview && (
                <div className="card-modern p-6 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Personalised roadmap</p>
                      <h3 className="text-2xl font-bold text-gray-900">{planPreview.careerPath}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSavePlan}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      >
                        Save plan to dashboard
                      </button>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                      >
                        Choose another path
                      </button>
                    </div>
                  </div>
                  <LearningPlanSummary plan={planPreview} onCoursesChange={handleCoursesChange} />
                </div>
              )}

              {!planPreview && matches.length > 0 && (
                <div className="card-modern border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                  Select a career card to preview the learning plan built around your interests and current skills.
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
