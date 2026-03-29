'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { roadmapAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, BookOpen, Loader2, Sparkles, Target } from 'lucide-react'

function clampPct(n: any) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

function getCurrentStep(course: any) {
  const steps = Array.isArray(course?.steps) ? course.steps : []
  const currentIndex = Number.isFinite(course?.current_step) ? Number(course.current_step) : 0
  return steps[currentIndex] || steps[0] || null
}

export default function CoursesPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [loading, setLoading] = useState(true)
  const [roadmaps, setRoadmaps] = useState<any[]>([])

  useEffect(() => {
    if (!isAuthenticated) return
    roadmapAPI
      .getAllRoadmaps()
      .then((r) => setRoadmaps(Array.isArray(r) ? r : []))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const sorted = useMemo(() => {
    return [...roadmaps].sort((a, b) => (b?.id || 0) - (a?.id || 0))
  }, [roadmaps])

  const recommendedCourse = useMemo(() => {
    return sorted.find((course) => clampPct(course?.completion_percentage) < 100) || sorted[0] || null
  }, [sorted])

  const otherCourses = useMemo(() => {
    return recommendedCourse ? sorted.filter((course) => course.id !== recommendedCourse.id) : []
  }, [recommendedCourse, sorted])

  const recommendedStep = recommendedCourse ? getCurrentStep(recommendedCourse) : null
  const recommendedPct = Math.round(clampPct(recommendedCourse?.completion_percentage))
  const recommendedSteps = Array.isArray(recommendedCourse?.steps) ? recommendedCourse.steps.length : 0
  const recommendedCurrent = Number.isFinite(recommendedCourse?.current_step) ? Number(recommendedCourse.current_step) : 0

  return (
    <div className="space-y-8">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Courses</h1>
          <p className="text-slate-500 font-medium">TrainPi now picks the right starting course and keeps the learning flow inside the platform.</p>
        </div>
        <Link href="/roadmap" className="btn-primary inline-flex items-center gap-2">
          <BookOpen size={18} />
          Create / manage roadmap
        </Link>
      </div>

      {loading ? (
        <div className="min-h-[240px] flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={28} />
        </div>
      ) : sorted.length === 0 ? (
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-700 to-slate-900 text-white shadow-2xl shadow-indigo-200/50 p-10 sm:p-16 text-center">
          {/* Animated blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          <div className="relative z-10">
            {/* Icon */}
            <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
              <BookOpen size={40} className="text-white" />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-widest mb-6">
              <Sparkles size={12} />
              AI-Powered Learning
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Your Learning Journey<br />Starts Here
            </h2>
            <p className="text-indigo-100 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Create your first roadmap and TrainPi&apos;s AI will build you a personalized, step-by-step guided course — entirely inside the platform.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {['AI-generated curriculum', 'Step-by-step modules', 'Progress tracking', 'Built-in quizzes'].map((f) => (
                <span key={f} className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-semibold text-white/90 backdrop-blur-sm">
                  ✦ {f}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-black text-base shadow-xl shadow-black/20 hover:scale-[1.02] transition-transform"
              >
                <Target size={18} />
                Enroll a Career Path
                <ArrowRight size={18} />
              </button>
              <Link
                href="/roadmap"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-base hover:bg-white/20 transition-colors"
              >
                <BookOpen size={18} />
                Manage Roadmaps
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {recommendedCourse ? (
            <section className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-2xl shadow-indigo-100">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
              <div className="relative p-8 sm:p-10 lg:p-12 grid gap-8 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
                <div className="space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em]">
                    <Sparkles size={14} />
                    Recommended next course
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                      {recommendedCourse.career_path || 'Your guided learning path'}
                    </h2>
                    <p className="mt-3 max-w-2xl text-indigo-100 text-base sm:text-lg leading-relaxed">
                      Start with the next step TrainPi selected for you instead of sending learners into a generic catalog.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm max-w-2xl">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">Start here</p>
                      <div className="rounded-xl bg-white/15 px-3 py-1.5 text-sm font-bold">{recommendedPct}% complete</div>
                    </div>
                    <h3 className="text-2xl font-black">{recommendedStep?.title || 'Begin your learning path'}</h3>
                    <p className="mt-2 text-sm text-indigo-100 leading-relaxed">
                      {recommendedStep?.description || 'Open the course reader to study the next guided unit inside TrainPi.'}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-indigo-50">
                      <span>Step {recommendedStep?.step_number || Math.max(1, recommendedCurrent + 1)} of {recommendedSteps || 1}</span>
                      {recommendedStep?.estimated_time ? <span>{recommendedStep.estimated_time}</span> : null}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => router.push(`/courses/${recommendedCourse.id}`)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-black text-indigo-700 shadow-lg shadow-black/10 transition hover:scale-[1.01]"
                    >
                      Start current course <ArrowRight size={18} />
                    </button>
                    <Link
                      href={`/roadmap?id=${recommendedCourse.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-base font-bold text-white transition hover:bg-white/15"
                    >
                      View roadmap details
                    </Link>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/15 bg-slate-950/25 p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                      <Target size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-100">Why this course</p>
                      <h3 className="text-lg font-black">Guided, focused, in-platform</h3>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-indigo-50">
                    <li className="rounded-2xl bg-white/5 px-4 py-3">TrainPi brings the learner directly into the right module instead of a broad catalog.</li>
                    <li className="rounded-2xl bg-white/5 px-4 py-3">Course steps open TrainPi lessons and quizzes, not Google or YouTube tabs.</li>
                    <li className="rounded-2xl bg-white/5 px-4 py-3">Reference sources still inform the curriculum, but the learning experience stays contained.</li>
                  </ul>
                </div>
              </div>
            </section>
          ) : null}

          <section className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your learning paths</h2>
                <p className="text-sm text-slate-500 font-medium">Additional paths remain accessible without crowding the first decision.</p>
              </div>
            </div>

            <div className="space-y-4">
              {(recommendedCourse ? [recommendedCourse, ...otherCourses] : sorted).map((course, index) => {
                const pct = Math.round(clampPct(course?.completion_percentage))
                const steps = Array.isArray(course?.steps) ? course.steps.length : 0
                const cur = Number.isFinite(course?.current_step) ? Number(course.current_step) : 0
                const currentStep = getCurrentStep(course)
                const isRecommended = recommendedCourse?.id === course.id && index === 0

                return (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="group flex flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Course</span>
                        {isRecommended ? (
                          <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700">Selected start</span>
                        ) : null}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 truncate">{course?.career_path || 'Untitled roadmap'}</h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {currentStep?.title ? `Next TrainPi module: ${currentStep.title}` : `Structured path with ${steps} guided steps`}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 md:min-w-[280px]">
                      <div className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>Progress</span>
                        <span>{steps ? `${cur}/${steps}` : '-'} </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700">{pct}% complete</span>
                        <span className="inline-flex items-center gap-2 text-sm font-black text-indigo-600 transition-colors group-hover:text-indigo-700">
                          Open course <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
