'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { readUserData, savePlanSnapshot } from '@/lib/api'
import { buildLearningPlan } from '@/lib/plan'

const DEFAULT_INTERESTS = ['Technology']
const DEFAULT_SKILLS = ['JavaScript']
const DEFAULT_PATH = 'Full Stack Developer'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const ensureStarterPlan = () => {
    const snapshot = readUserData()
    if (snapshot.plan) {
      return
    }
    const plan = buildLearningPlan(
      snapshot.profile?.career_path || DEFAULT_PATH,
      snapshot.profile?.interests || DEFAULT_INTERESTS,
      snapshot.profile?.skills || DEFAULT_SKILLS
    )
    savePlanSnapshot(plan, {
      interests: snapshot.profile?.interests || DEFAULT_INTERESTS,
      skills: snapshot.profile?.skills || DEFAULT_SKILLS,
      career_path: plan.careerPath,
      strengths: snapshot.profile?.strengths || DEFAULT_SKILLS,
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 400))

    const allUsers = JSON.parse(localStorage.getItem('trainpi-users') || '[]')
    let user = allUsers.find((entry: any) => entry.email === email)

    if (!user) {
      user = {
        id: Date.now(),
        email,
        password,
        full_name: email.split('@')[0] || 'Learner',
      }
      allUsers.push(user)
    } else {
      user.password = password
    }

    localStorage.setItem('trainpi-users', JSON.stringify(allUsers))

    setAuth({ id: user.id, email: user.email, full_name: user.full_name }, 'mock-token-' + Date.now())
    ensureStarterPlan()

    toast.success('Signed in to TrainPi')
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
                required
                minLength={4}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Remember me
              </label>
              <Link href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In ->'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Do not have an account?{' '}
              <Link href="/register" className="text-indigo-600 font-semibold hover:text-indigo-800 transition">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
