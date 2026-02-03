'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Logo from '@/components/Logo'
import { Lock, ArrowRight, Loader2, Eye, EyeOff, Check } from 'lucide-react'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [criteria, setCriteria] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link')
      router.push('/forgot-password')
    }
  }, [token, router])

  const checkPassword = (pass: string) => {
    setPassword(pass)
    setCriteria({
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    })
  }

  const isPasswordValid = Object.values(criteria).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authAPI.resetPassword(token, password)
      setSuccess(true)
      toast.success('Password reset. You can now sign in.')
      setTimeout(() => router.push('/login'), 2000)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-2 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Password reset</h2>
          <p className="mt-2 text-gray-600">Redirecting you to sign in...</p>
          <Link href="/login" className="mt-4 inline-flex items-center gap-2 text-indigo-600 font-medium">
            Go to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 mix-blend-multiply opacity-90" />
        <div className="absolute top-8 left-8 z-20">
          <Logo theme="dark" />
        </div>
        <div className="relative z-10 w-full flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Set new password</h1>
          <p className="text-xl text-indigo-100 max-w-md">
            Choose a strong password. You&apos;ll use it to sign in to TrainPi.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-6">
            <Logo />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">New password</h2>
            <p className="mt-2 text-gray-600">Enter your new password below.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => checkPassword(e.target.value)}
                  className="pl-10 pr-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'length', label: '8+ characters', done: criteria.length },
                  { key: 'upper', label: 'Uppercase', done: criteria.upper },
                  { key: 'lower', label: 'Lowercase', done: criteria.lower },
                  { key: 'number', label: 'Number', done: criteria.number },
                  { key: 'special', label: 'Special char', done: criteria.special },
                ].map(({ label, done }) => (
                  <div key={label} className={done ? 'text-green-600' : 'text-gray-400'}>
                    {done ? <Check className="w-3 h-3 inline mr-1" /> : <span className="inline w-3 h-3 mr-1 rounded-full border border-gray-400 inline-block align-middle" />}
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3"
                  placeholder="••••••••"
                />
                {confirmPassword.length > 0 && (
                  <span className={passwordsMatch ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                    {passwordsMatch ? 'Match' : 'Does not match'}
                  </span>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Resetting...
                </>
              ) : (
                <>
                  Reset password
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
