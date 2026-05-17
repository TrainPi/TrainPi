'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { DEMO_CAREERS } from '@/lib/demoData'
import { careerAPI } from '@/lib/api'
import {
  Briefcase,
  ArrowRight,
  Shield,
  ShieldAlert,
  Monitor,
  KeyRound,
  BrainCircuit,
  Check,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

const CAREER_ICONS: Record<string, React.ElementType> = {
  'Cybersecurity Analyst': Shield,
  'SOC Analyst': ShieldAlert,
  'IT Support to Cyber Transition': Monitor,
  'IAM Specialist': KeyRound,
  'AI Business Analyst': BrainCircuit,
}

export default function CareerPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)
  const [activePath, setActivePath] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
    if (typeof window !== 'undefined') {
      setActivePath(localStorage.getItem('trainpi_career_path'))
    }
  }, [isAuthenticated, router])

  const handleSelectCareer = async (careerId: string) => {
    setSelecting(careerId)
    try {
      await careerAPI.selectCareer(careerId)
      setActivePath(careerId)
      toast.success(`Career path set: ${careerId}`)
      setTimeout(() => router.push('/dashboard'), 600)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save career selection.')
      setSelecting(null)
    }
  }

  if (!isAuthenticated) return null

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Operational Career Pathfinder</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Pick a path. Get an operational roadmap.
        </h1>
        <p className="text-slate-500 font-medium max-w-2xl">
          TrainPi builds a workflow-aware roadmap — not just a list of courses. Every step maps to real organizational operations you'd execute on the job.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {DEMO_CAREERS.map((career) => {
          const Icon = CAREER_ICONS[career.id] ?? Briefcase
          const isActive = activePath === career.id
          return (
            <div
              key={career.id}
              className={`group bg-white rounded-3xl border-2 p-6 sm:p-7 shadow-sm transition-all relative overflow-hidden ${
                isActive
                  ? 'border-indigo-300 shadow-xl shadow-indigo-100/40'
                  : 'border-slate-100 hover:border-indigo-200 hover:shadow-lg'
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10" />

              {isActive && (
                <span className="absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow">
                  <Check className="w-3 h-3" />
                  Active path
                </span>
              )}

              <div className="flex items-start gap-4 relative">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all'
                }`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-black text-slate-900 mb-1.5">{career.id}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">{career.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {career.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-slate-50 text-slate-700 text-[11px] rounded-md font-bold border border-slate-100">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSelectCareer(career.id)}
                    disabled={!!selecting || isActive}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      isActive
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : selecting === career.id
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700'
                    }`}
                  >
                    {isActive ? (
                      <>
                        <Check className="w-4 h-4" />
                        Current path
                      </>
                    ) : selecting === career.id ? (
                      'Building roadmap…'
                    ) : (
                      <>
                        Select this path
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl border border-violet-100 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-slate-900 mb-1">Not sure which path fits you?</p>
            <p className="text-sm text-slate-600">Upload your resume on the profile page — the mentor will recommend the closest match and map your gaps.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-violet-300 hover:text-violet-600 transition shrink-0"
        >
          Open profile
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
