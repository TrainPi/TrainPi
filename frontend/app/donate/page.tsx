'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'
import { Heart, ArrowLeft } from 'lucide-react'

export default function DonatePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/" className="text-slate-600 hover:text-violet-600 font-medium flex items-center gap-1">
            <ArrowLeft size={18} /> Back
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 mb-8">
          <Heart size={32} className="fill-violet-500 text-violet-500" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
          Donate to TrainPi
        </h1>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
          Your support helps us keep building AI-powered learning tools for everyone. Secure donations via Stripe are coming soon.
        </p>

        <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 p-8 sm:p-10 mb-10">
          <p className="text-violet-800 font-semibold mb-2">Donate now</p>
          <p className="text-slate-600 text-sm mb-6">
            We&apos;re adding Stripe so you can donate safely. Check back soon or contact us to be notified.
          </p>
          <button
            type="button"
            disabled
            className="px-6 py-3 rounded-xl bg-slate-200 text-slate-500 font-medium cursor-not-allowed"
          >
            Coming soon
          </button>
        </div>

        <p className="text-sm text-slate-500">
          <Link href="/contact" className="text-violet-600 hover:text-violet-700 font-medium">Contact us</Link>
          {' '}for other ways to support.
        </p>
      </main>
    </div>
  )
}
