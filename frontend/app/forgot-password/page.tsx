'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Logo from '@/components/Logo'
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSent(false)
    setResetLink(null)
    try {
      const res = await authAPI.forgotPassword(email)
      setSent(true)
      if (res.reset_link) setResetLink(res.reset_link)
      toast.success('If an account exists with this email, you will receive a reset link.')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 mix-blend-multiply opacity-90" />
        <div className="absolute top-8 left-8 z-20">
          <Logo theme="dark" />
        </div>
        <div className="relative z-10 w-full flex flex-col justify-center px-12 text-white">
          <h1 className="text-5xl font-bold mb-6">Reset your password</h1>
          <p className="text-xl text-indigo-100 max-w-md">
            Enter your email and we&apos;ll send you a link to set a new password.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-6">
            <Logo />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Forgot password?</h2>
            <p className="mt-2 text-gray-600">Enter your email to get a reset link.</p>
          </div>

          {sent ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 space-y-4">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Check your email</span>
              </div>
              <p className="text-sm text-gray-600">
                If an account exists with that email, we sent a reset link. For development, the link is also below (if returned by the server).
              </p>
              {resetLink && (
                <div className="text-xs break-all p-3 bg-white rounded border border-green-200 text-indigo-600">
                  <a href={resetLink} className="underline" target="_blank" rel="noopener noreferrer">
                    {resetLink}
                  </a>
                </div>
              )}
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    className="pl-10 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
