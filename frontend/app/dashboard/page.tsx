'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function DashboardPage() {
  const { isAuthenticated, clearAuth, user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadDashboard()
  }, [isAuthenticated, router])

  const loadDashboard = async () => {
    // Load from localStorage (frontend-only mode)
    const userData = localStorage.getItem(`trainpi-user-${user?.id}`)
    if (userData) {
      const data = JSON.parse(userData)
      setStats(data.stats || {
        career_path: 'Not Selected',
        roadmap_completion: 0,
        skills_acquired: 0,
        skills_required: 0,
        courses_enrolled: 0,
        courses_completed: 0,
        lessons_in_progress: 0,
        resume_score: 0,
        weekly_goals: [],
        suggested_next_steps: []
      })
    } else {
      setStats({
        career_path: 'Not Selected',
        roadmap_completion: 0,
        skills_acquired: 0,
        skills_required: 0,
        courses_enrolled: 0,
        courses_completed: 0,
        lessons_in_progress: 0,
        resume_score: 0,
        weekly_goals: ['Select a career path', 'Create your first lesson', 'Build your resume'],
        suggested_next_steps: ['Start career discovery', 'Upload a document to create lessons']
      })
    }
    setLoading(false)
  }

  const handleSignOut = () => {
    clearAuth()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition">Learn</Link>
              <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition">Career</Link>
              <Link href="/mentor" className="text-gray-700 hover:text-indigo-600 transition">Mentor</Link>
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition">Profile</Link>
              <Link href="/profile" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-medium">
                Update Profile
              </Link>
              <button onClick={handleSignOut} className="text-gray-700 hover:text-indigo-600 transition">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600">Here's your learning progress overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.courses_completed || 0}</h3>
            <p className="text-gray-600 text-sm">Courses Completed</p>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-accent rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.lessons_in_progress || 0}</h3>
            <p className="text-gray-600 text-sm">Lessons in Progress</p>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-success rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.skills_acquired || 0}/{stats?.skills_required || 0}</h3>
            <p className="text-gray-600 text-sm">Skills Acquired</p>
          </div>

          <div className="card-modern p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 gradient-secondary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats?.lessons_completed || 0}</h3>
            <p className="text-gray-600 text-sm">Lessons Completed</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* Career Path Progress */}
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Career Path Progress</h2>
                <Link href="/career" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Update Career →
                </Link>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">{stats?.career_path || 'Not Selected'}</span>
                  <span className="text-gray-600">{stats?.roadmap_completion || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats?.roadmap_completion || 0}%` }}></div>
                </div>
              </div>
            </div>

            {/* My Lessons */}
            <div className="card-modern p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">My Lessons</h2>
                <Link href="/learn" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  View All →
                </Link>
              </div>
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <p>Start creating lessons to see them here</p>
                  <Link href="/learn" className="mt-4 inline-block btn-primary">
                    Create Lesson
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Weekly Goals */}
            <div className="card-modern p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Weekly Goals</h2>
              <ul className="space-y-3">
                {(stats?.weekly_goals || []).map((goal: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600" />
                    <span className="text-gray-700">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Next Steps */}
            <div className="card-modern p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Suggested Next Steps</h2>
              <ul className="space-y-3">
                {(stats?.suggested_next_steps || []).map((step: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2"></div>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="card-modern p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/career" className="block w-full btn-primary text-center">
                  Find Career Path
                </Link>
                <Link href="/mentor" className="block w-full btn-secondary text-center">
                  Consult Mentor
                </Link>
                <Link href="/learn" className="block w-full btn-secondary text-center">
                  Create Lesson
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
