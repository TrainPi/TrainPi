'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { savePlanSnapshot, readUserData } from '@/lib/api'
import { buildLearningPlan } from '@/lib/plan'

const DEFAULT_INTERESTS = ['Technology']
const DEFAULT_SKILLS = ['JavaScript']
const DEFAULT_PATH = 'Full Stack Developer'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const seedPlan = () => {
    const snapshot = readUserData()
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

    const users = JSON.parse(localStorage.getItem('trainpi-users') || '[]')
    if (users.find((entry: any) => entry.email === email)) {
      toast.error('Email already registered')
      setLoading(false)
      return
    }

    const newUser = {
      id: Date.now(),
      email,
      password,
      full_name: fullName || email.split('@')[0] || 'Learner',
    }

    users.push(newUser)
    localStorage.setItem('trainpi-users', JSON.stringify(users))

    setAuth({ id: newUser.id, email: newUser.email, full_name: newUser.full_name }, 'mock-token-' + Date.now())
    seedPlan()

    toast.success('Account created successfully')
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">Get Started</h1>
            <p className="text-gray-600">Create your account and start learning</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Jordan Learner"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition outline-none"
              />
            </div>

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
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-2">Must be at least 6 characters long</p>
            </div>

            <div className="flex items-start">
              <input type="checkbox" className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" required />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link href="#" className="text-indigo-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="#" className="text-indigo-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account ->'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-800 transition">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
