'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function DashboardPage() {
  const { isAuthenticated, clearAuth, user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadDashboard()
  }, [isAuthenticated, router])

  const loadDashboard = async () => {
    const userData = localStorage.getItem(`trainpi-user-${user?.id}`)
    if (userData) {
      const data = JSON.parse(userData)
      setStats(data.stats || { career_path: 'Data Scientist', roadmap_completion: 0, skills_acquired: 0, skills_required: 0, courses_completed: 0, lessons_in_progress: 0, lessons_completed: 0 })
    } else {
      setStats({ career_path: 'Data Scientist', roadmap_completion: 0, skills_acquired: 0, skills_required: 0, courses_completed: 0, lessons_in_progress: 0, lessons_completed: 0 })
    }
    setLoading(false)
  }

  const handleSignOut = () => {
    clearAuth()
    router.push('/')
  }

  if (loading) {
    return ( <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-xl">Loading...</div></div> )
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-8">
              <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition text-sm">Learn</Link>
              <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition text-sm">Career</Link>
              <Link href="/mentor" className="text-gray-700 hover:text-indigo-600 transition text-sm">Mentor</Link>
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition text-sm">Profile</Link>
              <Link href="/profile" className="text-indigo-600 hover:text-indigo-800 transition text-sm font-medium">Update Profile</Link>
              <button onClick={handleSignOut} className="text-gray-700 hover:text-indigo-600 transition text-sm">Sign out</button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition">Find Career Path</button>
                <button className="w-full border-2 border-indigo-600 text-indigo-600 font-semibold py-3 px-4 rounded-lg hover:bg-indigo-50 transition">My Skills & Interests</button>
                <button className="w-full border-2 border-indigo-600 text-indigo-600 font-semibold py-3 px-4 rounded-lg hover:bg-indigo-50 transition">Need Coach/Mentor</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-5xl font-bold text-indigo-600 mb-2">Dashboard</h1>
              <p className="text-xl font-semibold text-gray-900">Welcome back, {user?.full_name || 'Nina'}! </p>
              <p className="text-gray-600 text-sm">Here's your learning progress overview</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <p className="text-gray-700 font-medium mb-4">Hello, how may I help you?</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-3">
                  <span className="text-lg">💬</span>
                  <input type="text" placeholder="Message from Mentor Titan" className="flex-1 bg-gray-100 focus:outline-none text-sm text-gray-700" />
                </div>
                <button className="bg-gray-800 text-white px-4 py-3 rounded-lg hover:bg-gray-900 font-bold"></button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Career Path Progress</h2>
                <Link href="/career" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Update Career →</Link>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">{stats?.career_path}</span>
                  <span className="text-gray-600 font-medium">{stats?.roadmap_completion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${stats?.roadmap_completion}%` }}></div></div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Lessons</h2>
                <Link href="/learn" className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">View All </Link>
              </div>
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Start creating lessons to see them here</p>
                <Link href="/learn" className="inline-block bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 transition">Create Lesson</Link>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-indigo-600 text-center mb-8">Progress</h2>
              
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.courses_completed}</h3>
                <p className="text-gray-600 text-sm">Courses Completed</p>
              </div>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-blue-400 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.lessons_in_progress}</h3>
                <p className="text-gray-600 text-sm">Lessons in Progress</p>
              </div>

              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-green-400 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.skills_acquired}/{stats?.skills_required}</h3>
                <p className="text-gray-600 text-sm">Skills Acquired</p>
              </div>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-pink-400 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{stats?.lessons_completed}</h3>
                <p className="text-gray-600 text-sm">Lessons Completed</p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-bold text-gray-900 text-sm">Career Path Progress</h3>
                <p className="text-sm text-gray-600">{stats?.career_path}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}