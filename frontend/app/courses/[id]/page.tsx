'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { aiFeaturesAPI, lessonsAPI, roadmapAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { buildTrainPiLessonTopic, getReferenceSources, getRoadmapLessonId, setRoadmapLessonId } from '@/lib/trainpiLearning'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Loader2, Sparkles, Target } from 'lucide-react'
import toast from 'react-hot-toast'

function clampPct(n: any) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
}

export default function CourseReaderPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [loading, setLoading] = useState(true)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [launchingLesson, setLaunchingLesson] = useState(false)
  const [savedLessonId, setSavedLessonId] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    const rid = Number(id)
    if (!Number.isFinite(rid)) return
    setLoading(true)
    roadmapAPI
      .getMyRoadmap(rid)
      .then((r) => {
        setRoadmap(r)
        const cur = Number.isFinite(r?.current_step) ? Number(r.current_step) : 0
        setActiveIdx(Math.max(0, cur))
      })
      .finally(() => setLoading(false))
  }, [id, isAuthenticated])

  const steps = useMemo(() => (Array.isArray(roadmap?.steps) ? roadmap.steps : []), [roadmap])
  const pct = Math.round(clampPct(roadmap?.completion_percentage))
  const active = steps[activeIdx] || null
  const activeStepNumber = Number.isFinite(active?.step_number) ? Number(active.step_number) : activeIdx + 1
  const referenceSources = useMemo(() => getReferenceSources(active), [active])

  useEffect(() => {
    if (!roadmap?.id) return
    setSavedLessonId(getRoadmapLessonId(roadmap.id, activeStepNumber))
  }, [roadmap?.id, activeStepNumber])

  const markCompleteAndNext = async () => {
    if (!roadmap?.id) return
    const completedCount = activeIdx + 1
    setUpdating(true)
    try {
      const res = await roadmapAPI.updateProgress(roadmap.id, completedCount)
      const nextIdx = Math.min(steps.length - 1, activeIdx + 1)
      setRoadmap({
        ...roadmap,
        current_step: completedCount,
        completion_percentage: res?.completion_percentage ?? roadmap.completion_percentage,
      })
      setActiveIdx(nextIdx)
      toast.success('Progress updated.')
    } finally {
      setUpdating(false)
    }
  }

  const openTrainPiLesson = async () => {
    if (!roadmap?.id || !active) return

    const existingLessonId = savedLessonId || getRoadmapLessonId(roadmap.id, activeStepNumber)
    if (existingLessonId) {
      router.push(`/learn/${existingLessonId}`)
      return
    }

    setLaunchingLesson(true)
    try {
      const generated = await aiFeaturesAPI.generateLesson(
        buildTrainPiLessonTopic(roadmap.career_path || 'career learner', active)
      )

      if (!generated?.title || !Array.isArray(generated.modules)) {
        throw new Error('TrainPi could not build a guided lesson for this step.')
      }

      const created = await lessonsAPI.createFromAI({
        title: generated.title,
        modules: generated.modules,
        quiz_questions: generated.quiz_questions ?? [],
      })

      setRoadmapLessonId(roadmap.id, activeStepNumber, created.id)
      setSavedLessonId(created.id)
      toast.success('Your TrainPi lesson is ready.')
      router.push(`/learn/${created.id}`)
    } catch (error: any) {
      const message = error?.response?.data?.detail ?? error?.message ?? 'Failed to launch the TrainPi lesson.'
      toast.error(message)
      if (error?.response?.status === 402 || /credit|quota/i.test(String(message))) {
        toast('Add your Gemini key or buy credits at Manage Credits.', { icon: 'i' })
      }
    } finally {
      setLaunchingLesson(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={28} />
      </div>
    )
  }

  if (!roadmap) {
    return (
      <div className="card-premium p-12 text-center">
        <p className="text-slate-700 font-bold">Course not found.</p>
        <button onClick={() => router.push('/courses')} className="btn-primary mt-6">
          Back to courses
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => router.push('/courses')}
            className="text-xs font-black text-slate-500 hover:text-slate-900 flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to courses
          </button>
          <h1 className="mt-3 text-lg font-black text-slate-900 leading-tight">{roadmap.career_path}</h1>
          <div className="mt-3 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold">{pct}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {steps.length ? `${roadmap?.current_step ?? 0}/${steps.length}` : '-'}
            </div>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {steps.map((step: any, idx: number) => {
            const isActive = idx === activeIdx
            const completedCount = Number.isFinite(roadmap?.current_step) ? Number(roadmap.current_step) : 0
            const isDone = idx < completedCount
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={[
                  'w-full text-left rounded-2xl px-4 py-3 mb-2 border transition-colors',
                  isActive ? 'border-indigo-200 bg-indigo-50/40' : 'border-slate-200 bg-white hover:bg-slate-50',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Step {step?.step_number ?? idx + 1}
                    </p>
                    <p className="text-sm font-black text-slate-900 truncate">{step?.title || 'Untitled step'}</p>
                  </div>
                  {isDone ? <CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> : null}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Step {activeStepNumber}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{active?.title || 'Untitled step'}</h2>
          {active?.estimated_time ? (
            <p className="text-sm text-slate-500 font-medium mt-1">Target time: {active.estimated_time}</p>
          ) : null}
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-[1.75rem] border border-indigo-100 bg-indigo-50/40 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">TrainPi course mode</h3>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                  This step is taught as an internal TrainPi lesson with modules and a quiz. Reference sources inform the plan, but the learner stays on the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="space-y-4 rounded-[1.75rem] border border-slate-200 p-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">What you will learn</p>
                <p className="mt-2 text-slate-700 leading-relaxed text-base">{active?.description || 'No description available for this step.'}</p>
              </div>

              {Array.isArray(active?.skills) && active.skills.length > 0 ? (
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">Skill focus</p>
                  <div className="flex flex-wrap gap-2">
                    {active.skills.map((skill: string) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3 rounded-[1.75rem] border border-slate-200 p-5 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Target size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Inside TrainPi</p>
                  <h3 className="text-base font-black text-slate-900">Guided delivery</h3>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200 text-sm text-slate-600">Structured lesson modules with focused explanations.</div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200 text-sm text-slate-600">Quiz generation tied to the lesson so users can check understanding without leaving.</div>
              <div className="rounded-2xl bg-white p-4 border border-slate-200 text-sm text-slate-600">Progress tracking stays aligned with the active roadmap step.</div>
            </div>
          </div>

          {referenceSources.length > 0 ? (
            <div className="space-y-3 rounded-[1.75rem] border border-slate-200 p-5">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Reference sources used for curation</h3>
              </div>
              <p className="text-sm text-slate-500">Visible for transparency only. TrainPi uses these as planning inputs and keeps the actual course inside the product.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {referenceSources.map((name) => (
                  <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500 mt-1">Reference only, not an outbound learner step.</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveIdx((idx) => Math.max(0, idx - 1))}
                disabled={activeIdx === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setActiveIdx((idx) => Math.min(steps.length - 1, idx + 1))}
                disabled={activeIdx >= steps.length - 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={openTrainPiLesson}
                disabled={launchingLesson || steps.length === 0}
                className="px-6 py-3 rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-700 font-black hover:bg-indigo-100 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {launchingLesson ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Building lesson
                  </>
                ) : savedLessonId ? (
                  <>
                    Resume TrainPi lesson <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    Start in TrainPi <ArrowRight size={18} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={markCompleteAndNext}
                disabled={updating || steps.length === 0}
                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Updating
                  </>
                ) : (
                  <>
                    Mark complete <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
