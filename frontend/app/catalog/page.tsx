'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, Clock, BookOpen, Search } from 'lucide-react'
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

export default function LearnPage() {
  const [enrollments, setEnrollments] = useState<Record<string, Enrollment>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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

  const filtered = COURSE_CATALOG.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-slate-900">Learn</h1>
          <p className="text-slate-500 mt-1">Pick a course — watch videos, track your progress, build real skills.</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 text-sm"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-56 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-bold">No courses found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course) => {
              const enroll = enrollments[course.id]
              const pct = enroll ? getCompletionPct(enroll.completed_units, course.units.length) : 0
              return (
                <Link
                  key={course.id}
                  href={`/catalog/${course.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <div className={`bg-gradient-to-br ${course.gradient} p-5 relative`}>
                    <div className="text-3xl mb-1">{course.icon}</div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${levelColor[course.level]} bg-white/80`}>
                      {course.level}
                    </span>
                    {enroll?.completed && (
                      <CheckCircle2 size={18} className="absolute top-3 right-3 text-white drop-shadow" />
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-slate-900 text-sm leading-snug group-hover:text-violet-700 transition-colors mb-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{course.description}</p>

                    <div className="mt-auto space-y-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={10} /> {course.duration}</span>
                        <span className="flex items-center gap-1"><BookOpen size={10} /> {course.units.length} videos</span>
                      </div>

                      {enroll ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-500">{pct}% done</span>
                            <ChevronRight size={13} className="text-violet-500" />
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-violet-600 font-bold">
                          <span>Start Course</span>
                          <ChevronRight size={13} />
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
