'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { DEMO_CAREERS } from '@/lib/demoData'
import { Briefcase, ArrowRight } from 'lucide-react'

const DEMO_CAREER_KEY = 'trainpi_career_path'

export default function CareerPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleSelectCareer = (careerId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_CAREER_KEY, careerId)
    }
    router.push('/dashboard')
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
            <Link href="/learn" className="text-indigo-600 hover:text-indigo-500">Learning</Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Career Planning</h1>
        <p className="text-lg text-gray-600 mb-8">Choose a path to get a personalized roadmap and learning plan.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {DEMO_CAREERS.map((career) => (
            <div
              key={career.id}
              className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{career.id}</h2>
                  <p className="text-gray-600 text-sm mb-3">{career.description}</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {career.skills.map((skill) => (
                      <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleSelectCareer(career.id)}
                    className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700"
                  >
                    Select path <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          Your roadmap and dashboard will update based on your selection.
        </p>
      </main>
    </div>
  )
}
