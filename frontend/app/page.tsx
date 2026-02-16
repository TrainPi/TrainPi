'use client'

import Link from 'next/link'
import { useAuthStore } from '../store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { ArrowRight, Sparkles, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Offering = {
  icon: string
  title: string
  description: string
  features: string[]
}

type Highlight = {
  icon: string
  title: string
  description: string
}

const offerings: Offering[] = [
  {
    icon: '[AI]',
    title: 'AI-Powered Career Pathfinder',
    description: 'Discover your ideal career path through intelligent matching.',
    features: [
      'Career discovery wizard',
      'AI career matching',
      'Salary and growth trends',
    ],
  },
  {
    icon: '[ML]',
    title: 'Mini-Lesson Generator',
    description: 'Convert uploaded documents into interactive micro-learning modules.',
    features: [
      'Document upload',
      'AI content breakdown',
      'Interactive quizzes',
    ],
  },
  {
    icon: '[Mentor]',
    title: 'AI Mentor Agent',
    description: 'Get personalized guidance anytime with weekly check-ins.',
    features: [
      'Weekly check-ins',
      'Real-time guidance',
      'Learning reminders',
    ],
  },
]

const highlights: Highlight[] = [
  {
    icon: '[L]',
    title: 'Personalized Learning',
    description: 'Adaptive paths tuned to your progress.',
  },
  {
    icon: '[P]',
    title: 'Progress Tracking',
    description: 'Monitor growth with actionable insights.',
  },
  {
    icon: '[C]',
    title: 'Certifications',
    description: 'Earn credentials that matter.',
  },
  {
    icon: '[R]',
    title: 'Career Ready',
    description: 'Job-ready support in one platform.',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // No loading gate here to prevent hydration hangs

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex-shrink-0">
              <Logo />
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/career" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                Career
              </Link>
              <Link href="/demo" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                Demo
              </Link>
              <Link href="/donate" className="text-slate-600 hover:text-violet-600 font-medium transition-colors">
                Donate
              </Link>
              {mounted && (
                <>
                  {!isAuthenticated && (
                    <>
                      <Link href="/login" className="px-6 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-white/50 transition-all">
                        Sign In
                      </Link>
                      <Link href="/login" className="btn-primary">
                        Get Started
                      </Link>
                    </>
                  )}
                  {isAuthenticated && (
                    <Link href="/dashboard" className="btn-primary">
                      Go to Dashboard
                    </Link>
                  )}
                </>
              )}
            </div>
            <button
              type="button"
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-white/50 hover:text-slate-900"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white/95 backdrop-blur border-t border-white/60 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                <Link href="/career" className="block py-3 text-slate-700 font-medium hover:text-violet-600" onClick={() => setMobileMenuOpen(false)}>Career</Link>
                <Link href="/demo" className="block py-3 text-slate-700 font-medium hover:text-violet-600" onClick={() => setMobileMenuOpen(false)}>Demo</Link>
                <Link href="/donate" className="block py-3 text-slate-700 font-medium hover:text-violet-600" onClick={() => setMobileMenuOpen(false)}>Donate</Link>
                {mounted && (
                  !isAuthenticated ? (
                    <>
                      <Link href="/login" className="block py-3 text-slate-700 font-medium hover:text-violet-600" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                      <Link href="/login" className="block py-3 text-center btn-primary mt-2" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                    </>
                  ) : (
                    <Link href="/dashboard" className="block py-3 text-center btn-primary mt-2" onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 -left-4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 sm:w-96 sm:h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm mb-6 sm:mb-8 animate-float">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-slate-600">The Future of AI Learning is Here</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8 text-balance px-1">
            Master Any Skill with <br />
            <span className="gradient-text font-extrabold">AI-Powered mentorship</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed text-balance px-2">
            TrainPi creates personalized, adaptive learning paths tailored to your unique goals. Experience a curriculum that evolves with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2">
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="btn-primary flex items-center justify-center gap-2 text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 shadow-xl shadow-violet-200 w-full sm:w-auto"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto text-center px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-white/60 backdrop-blur-md text-slate-700 font-semibold text-base sm:text-lg border border-white/60 hover:bg-white/80 hover:border-violet-300 hover:shadow-lg transition-all duration-300"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* What TrainPi Offers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 lg:mb-32">
        <h2 className="text-2xl sm:text-4xl font-bold text-center text-slate-900 mb-10 sm:mb-16">What TrainPi Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[
            {
              icon: '🎯',
              title: 'AI-Powered Career Pathfinder',
              desc: 'Discover your ideal career path through intelligent matching based on your interests, skills, and goals. Get personalized recommendations with salary ranges and growth outlook.',
              features: ['Career Discovery Wizard', 'AI Career Matching', 'Salary & Growth Data']
            },
            {
              icon: '📚',
              title: 'Mini-Lesson Generator',
              desc: 'Convert uploaded documents (SOPs, manuals, whitepapers) into interactive micro-learning modules. AI breaks content into 2-5 minute digestible lessons with quizzes.',
              features: ['Document Upload', 'AI Content Breakdown', 'Interactive Quizzes', 'Multiple Learning Modes']
            },
            {
              icon: '🤝',
              title: 'AI Mentor Agent',
              desc: 'Get personalized guidance anytime. Weekly check-ins, just-in-time help, learning reminders, and motivational insights based on your progress.',
              features: ['Weekly Check-ins', 'Real-time Guidance', 'Learning Reminders', 'Progress Insights']
            },
          ].map((feature, i) => (
            <div key={i} className="card-premium p-5 sm:p-8 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-4xl mb-4 sm:mb-6 bg-white/50 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-sm">{feature.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">{feature.title}</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6 leading-relaxed">{feature.desc}</p>
              <ul className="space-y-3">
                {feature.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="text-violet-600 mt-0.5 font-bold">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 lg:mb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {
            [
              { icon: '🎓', title: 'Personalized Learning', desc: 'AI adapts to your learning style and pace' },
              { icon: '📈', title: 'Progress Tracking', desc: 'Monitor your growth with detailed analytics' },
              { icon: '🏆', title: 'Certifications', desc: 'Earn credentials recognized by employers' },
              { icon: '💼', title: 'Career Ready', desc: 'From learning to job-ready in one platform' }
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-4 sm:p-6 text-center rounded-2xl hover:scale-[1.02] sm:hover:scale-105 transition-transform duration-300">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 lg:mb-32">
        <div className="glass-panel-heavy rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/20">
            <div className="pt-4 sm:pt-0 first:pt-0">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2 drop-shadow-sm">10K+</div>
              <div className="text-indigo-100 font-medium text-sm sm:text-base">Active Learners</div>
            </div>
            <div className="pt-4 sm:pt-0">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2 drop-shadow-sm">500+</div>
              <div className="text-indigo-100 font-medium text-sm sm:text-base">Courses Available</div>
            </div>
            <div className="pt-4 sm:pt-0">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-2 drop-shadow-sm">95%</div>
              <div className="text-indigo-100 font-medium text-sm sm:text-base">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-24 lg:mb-32 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-3xl opacity-20 rounded-full"></div>
          <div className="relative glass-panel rounded-2xl sm:rounded-3xl p-8 sm:p-12 lg:p-16 border-t border-white/60">
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">Ready to Start Your Journey?</h2>
            <p className="text-slate-600 mb-8 sm:mb-10 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
              Join thousands of learners who are transforming their careers with TrainPi.
              Create your free account and discover your path to success.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/login" className="btn-primary text-base sm:text-lg px-8 py-3 sm:px-10 sm:py-4 shadow-xl shadow-fuchsia-200">
                Get Started →
              </Link>
              <Link href="/register" className="px-8 py-3 sm:px-10 sm:py-4 rounded-xl bg-white text-slate-700 font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-base sm:text-lg">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
