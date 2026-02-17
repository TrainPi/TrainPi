'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { roadmapAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react'

function clampPct(n: any) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(100, x))
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

  return (
    <div className="space-y-8">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Courses</h1>
          <p className="text-slate-500 font-medium">Pick up where you left off, Educative-style.</p>
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
        <div className="card-premium p-12 text-center">
          <h2 className="text-xl font-black text-slate-900 mb-2">No courses yet</h2>
          <p className="text-slate-500 font-medium mb-6">
            Create your first roadmap and it will show up here as a course.
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            Go to dashboard
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sorted.map((c) => {
            const pct = Math.round(clampPct(c?.completion_percentage))
            const steps = Array.isArray(c?.steps) ? c.steps.length : 0
            const cur = Number.isFinite(c?.current_step) ? Number(c.current_step) : 0
            const currentStep = Array.isArray(c?.steps) ? c.steps[cur] : null
            return (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Course</p>
                      <h3 className="text-lg font-black text-slate-900 truncate">
                        {c?.career_path || 'Untitled roadmap'}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {currentStep?.title ? `Continue: ${currentStep.title}` : `Steps: ${steps}`}
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold shrink-0">
                      {pct}%
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      <span>Progress</span>
                      <span>{steps ? `${Math.min(cur, steps)}/${steps}` : '—'}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-black text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    Continue learning
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

