'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { DEMO_CAREERS } from '@/lib/demoData'
import { careerAPI } from '@/lib/api'
import { Briefcase, ArrowRight, Shield, ShieldAlert, MonitorCog, KeyRound, BrainCircuit } from 'lucide-react'
import toast from 'react-hot-toast'

const CAREER_ICONS: Record<string, React.ElementType> = {
  'Cybersecurity Analyst': Shield,
  'SOC Analyst': ShieldAlert,
  'IT Support to Cyber Transition': MonitorCog,
  'IAM Specialist': KeyRound,
  'AI Business Analyst': BrainCircuit,
}

export default function CareerPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selecting, setSelecting] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleSelectCareer = async (careerId: string) => {
    setSelecting(careerId)
    try {
      await careerAPI.selectCareer(careerId)
      toast.success(`Career path set: ${careerId}`)
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Failed to save career selection.')
      setSelecting(null)
    }
  }

  if (!isAuthenticated) {
    return null
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
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Operational Career Pathfinder</h1>
        <p className="text-lg text-gray-600 mb-2">Choose a cybersecurity or technology career path.</p>
        <p className="text-sm text-gray-500 mb-8">TrainPi will build an operationally-grounded roadmap based on real organizational workflows — not just a list of courses.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DEMO_CAREERS.map((career) => {
            const Icon = CAREER_ICONS[career.id] ?? Briefcase
            return (
              <div
                key={career.id}
                className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{career.id}</h2>
                    <p className="text-gray-600 text-sm mb-3">{career.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {career.skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => handleSelectCareer(career.id)}
                      disabled={!!selecting}
                      className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 disabled:opacity-50"
                    >
                      {selecting === career.id ? 'Setting path...' : 'Select path'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Your operational roadmap and dashboard will update based on your selection.
        </p>
      </main>
    </div>
  )
}
