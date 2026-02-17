'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { roadmapAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'

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

  const markCompleteAndNext = async () => {
    if (!roadmap?.id) return
    const stepNumber = (active?.step_number ?? activeIdx + 1) + 1
    setUpdating(true)
    try {
      const res = await roadmapAPI.updateProgress(roadmap.id, stepNumber)
      const nextIdx = Math.min(steps.length - 1, activeIdx + 1)
      setRoadmap({
        ...roadmap,
        current_step: nextIdx,
        completion_percentage: res?.completion_percentage ?? roadmap.completion_percentage,
      })
      setActiveIdx(nextIdx)
    } finally {
      setUpdating(false)
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
      {/* Left outline (Educative-like) */}
      <aside className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <button
            type="button"
            onClick={() => router.push('/courses')}
            className="text-xs font-black text-slate-500 hover:text-slate-900 flex items-center gap-2"
          >
            <ArrowLeft size={14} /> Back to catalog
          </button>
          <h1 className="mt-3 text-lg font-black text-slate-900 leading-tight">{roadmap.career_path}</h1>
          <div className="mt-3 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold">{pct}%</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {steps.length ? `${Math.min(activeIdx, steps.length)}/${steps.length}` : '—'}
            </div>
          </div>
          <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3">
          {steps.map((s: any, idx: number) => {
            const isActive = idx === activeIdx
            const isDone = idx < (Number.isFinite(roadmap?.current_step) ? Number(roadmap.current_step) : 0)
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
                      Step {s?.step_number ?? idx + 1}
                    </p>
                    <p className="text-sm font-black text-slate-900 truncate">{s?.title || 'Untitled step'}</p>
                  </div>
                  {isDone ? <CheckCircle2 className="text-emerald-600 shrink-0" size={18} /> : null}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Main reader */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Step {active?.step_number ?? activeIdx + 1}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{active?.title || 'Untitled step'}</h2>
          {active?.estimated_time ? (
            <p className="text-sm text-slate-500 font-medium mt-1">⏳ {active.estimated_time}</p>
          ) : null}
        </div>

        <div className="p-6 space-y-6">
          <p className="text-slate-700 leading-relaxed text-base">{active?.description || 'No description.'}</p>

          {Array.isArray(active?.resources) && active.resources.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {active.resources.map((r: any, i: number) => (
                  <a
                    key={i}
                    href={r?.url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all"
                  >
                    <p className="text-sm font-black text-slate-900">{r?.name || 'Resource'}</p>
                    <p className="text-xs text-slate-500 break-all">{r?.url}</p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setActiveIdx((i) => Math.min(steps.length - 1, i + 1))}
              disabled={activeIdx >= steps.length - 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <button
            type="button"
            onClick={markCompleteAndNext}
            disabled={updating || steps.length === 0}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Updating…
              </>
            ) : (
              <>
                Mark complete <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  )
}

