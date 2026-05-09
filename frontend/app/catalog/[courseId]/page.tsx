'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle, Play, Lock } from 'lucide-react'
import { getCourse, getCompletionPct } from '@/lib/courseCatalog'
import { catalogAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import DashboardShell from '@/components/layout/DashboardShell'
import toast from 'react-hot-toast'

interface Enrollment {
  course_id: string
  completed_units: number[]
  completed: boolean
}

export default function CourseViewerPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params)
  const course = getCourse(courseId)
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [activeUnit, setActiveUnit] = useState(0)
  const [marking, setMarking] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login?next=/catalog/' + courseId); return }
    if (!course) { router.replace('/catalog'); return }
    catalogAPI.getEnrollments()
      .then((list: Enrollment[]) => {
        const found = list.find((e) => e.course_id === courseId)
        if (found) setEnrollment(found)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isAuthenticated, courseId, course, router])

  if (!course) return null

  const completedUnits: number[] = enrollment?.completed_units ?? []
  const pct = getCompletionPct(completedUnits, course.units.length)

  const handleEnroll = async () => {
    setEnrolling(true)
    try {
      const res = await catalogAPI.enroll(courseId)
      setEnrollment(res)
      toast.success('Enrolled! Start watching below.')
    } catch {
      toast.error('Could not enroll, try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleMarkComplete = async () => {
    if (!enrollment) return
    if (completedUnits.includes(activeUnit)) {
      // Go to next
      if (activeUnit < course.units.length - 1) setActiveUnit(activeUnit + 1)
      return
    }
    setMarking(true)
    try {
      const res = await catalogAPI.completeUnit(courseId, activeUnit)
      setEnrollment(res)
      toast.success('Unit marked complete!')
      if (activeUnit < course.units.length - 1) setActiveUnit(activeUnit + 1)
    } catch {
      toast.error('Failed to save progress.')
    } finally {
      setMarking(false)
    }
  }

  const unit = course.units[activeUnit]
  const embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(unit.search)}&autoplay=0`

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto">
        {/* Back + Header */}
        <div className="mb-6">
          <Link href="/catalog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600 mb-4">
            <ArrowLeft size={15} /> All Courses
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{course.icon}</span>
              <div>
                <h1 className="text-2xl font-black text-slate-900">{course.title}</h1>
                <p className="text-slate-500 text-sm">{course.description}</p>
              </div>
            </div>
            {!loading && !enrollment && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50 transition"
              >
                {enrolling ? 'Enrolling…' : 'Enroll Free'}
              </button>
            )}
          </div>

          {enrollment && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-violet-600 shrink-0">{pct}% done</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video player */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-black rounded-2xl overflow-hidden aspect-video relative">
              {enrollment ? (
                <iframe
                  key={activeUnit}
                  src={embedUrl}
                  title={unit.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white gap-3">
                  <Lock size={32} className="opacity-50" />
                  <p className="text-sm opacity-60">Enroll to watch videos</p>
                </div>
              )}
            </div>

            {enrollment && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h2 className="font-black text-slate-900 text-lg mb-1">{unit.title}</h2>
                <p className="text-slate-500 text-sm mb-4">{unit.description}</p>
                <button
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className={`px-6 py-2.5 rounded-xl font-bold transition ${
                    completedUnits.includes(activeUnit)
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  } disabled:opacity-50`}
                >
                  {completedUnits.includes(activeUnit)
                    ? (activeUnit < course.units.length - 1 ? '✓ Done — Next Unit →' : '✓ All Done!')
                    : (marking ? 'Saving…' : 'Mark as Complete')}
                </button>
              </div>
            )}
          </div>

          {/* Unit list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-sm">Course Units</h3>
            </div>
            <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
              {course.units.map((u, i) => {
                const done = completedUnits.includes(i)
                const active = i === activeUnit
                return (
                  <button
                    key={i}
                    onClick={() => enrollment && setActiveUnit(i)}
                    disabled={!enrollment}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition ${
                      active ? 'bg-violet-50' : 'hover:bg-slate-50'
                    } ${!enrollment ? 'opacity-50 cursor-default' : ''}`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {done ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : active ? (
                        <Play size={16} className="text-violet-600" />
                      ) : (
                        <Circle size={16} className="text-slate-300" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold leading-snug ${active ? 'text-violet-700' : 'text-slate-700'}`}>
                        {i + 1}. {u.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{u.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
