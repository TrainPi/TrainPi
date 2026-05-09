'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Clock, BarChart2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { COURSE_CATALOG, getCompletionPct } from '@/lib/courseCatalog'
import { catalogAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import DashboardShell from '@/components/layout/DashboardShell'

interface Enrollment {
  course_id: string
  completed_units: number[]
  completed: boolean
}

const levelColor: Record<string, string> = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-rose-100 text-rose-700',
}

export default function CatalogPage() {
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment>>({})
  const [loading, setLoading] = useState(true)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login?next=/catalog'); return }
    catalogAPI.getEnrollments()
      .then((list: Enrollment[]) => {
        const map: Record<string, Enrollment> = {}
        list.forEach((e) => { map[e.course_id] = e })
        setEnrollments(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated, router])

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Course Catalog</h1>
          <p className="text-slate-500 mt-1">Pick a course — watch videos, track progress, earn job-readiness badges.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {COURSE_CATALOG.map((course) => {
              const enroll = enrollments[course.id]
              const pct = enroll ? getCompletionPct(enroll.completed_units, course.units.length) : 0
              return (
                <Link
                  key={course.id}
                  href={`/catalog/${course.id}`}
                  className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex flex-col"
                >
                  {/* Top gradient */}
                  <div className={`bg-gradient-to-br ${course.gradient} p-6 relative`}>
                    <div className="text-4xl mb-2">{course.icon}</div>
                    {enroll?.completed && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 size={20} className="text-white drop-shadow" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-black text-slate-900 text-sm leading-snug group-hover:text-violet-700 transition-colors">{course.title}</h3>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColor[course.level]}`}>{course.level}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description}</p>

                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={11} /> {course.duration}</span>
                        <span className="flex items-center gap-1"><BookOpen size={11} /> {course.units.length} videos</span>
                      </div>

                      {enroll ? (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 font-medium">{pct}% complete</span>
                            <ChevronRight size={14} className="text-violet-500" />
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-violet-600 font-bold">
                          <span>Start Course</span>
                          <ChevronRight size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
