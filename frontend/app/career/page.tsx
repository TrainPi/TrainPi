'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function CareerPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

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
        <p className="text-lg text-gray-600 mb-8">Define your career goals to get started with TrainPi.</p>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Career discovery and roadmap features. Full UI can be restored from git history or rebuilt.
        </div>
      </main>
    </div>
  )
}
