'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Logo from '@/components/Logo'
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

    try {
      // 1. Login to get token
      const tokenData = await authAPI.login(email, password)

      // 2. Set token temporarily to allow getMe to work
      useAuthStore.setState({ token: tokenData.access_token })

      // 3. Get User Details
      const user = await authAPI.getMe()

      // 4. Update Store properly
      setAuth(user, tokenData.access_token)

      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Login error:', error)
      const detail = error.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join('. ') || 'Invalid email or password'
        : typeof detail === 'string'
          ? detail
          : 'Invalid email or password'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 mix-blend-multiply opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50" />

        {/* Logo positioned consistently */}
        <div className="absolute top-8 left-8 z-20">
          <Logo theme="dark" />
        </div>

        <div className="relative z-10 w-full flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Welcome Back!</h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-md">
            Ready to continue your progress? Your personal AI mentor is waiting for you.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-24 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <Logo />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Sign in to TrainPi</h2>
            <p className="mt-2 text-gray-600">Please enter your details to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 transition duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 transition duration-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => { window.location.href = `${API_URL}/api/auth/login/google` }}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                Continue with Google
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
