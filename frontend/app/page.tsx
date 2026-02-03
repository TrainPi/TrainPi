'use client'

import Link from 'next/link'
import { useAuthStore } from '../store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Logo from '../components/Logo'
import { ArrowRight, Sparkles } from 'lucide-react'

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

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [hydrated, isAuthenticated, router])

  const showAuthCTA = !hydrated || !isAuthenticated

  if (!mounted) return null

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
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
              {!isAuthenticated && (
                <>
                  <Link href="/login" className="px-6 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-white/50 transition-all">
                    Sign In
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm mb-8 animate-float">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-slate-600">The Future of AI Learning is Here</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 text-balance">
            Master Any Skill with <br />
            <span className="gradient-text font-extrabold">AI-Powered mentorship</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed text-balance">
            TrainPi creates personalized, adaptive learning paths tailored to your unique goals. Experience a curriculum that evolves with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="btn-primary flex items-center gap-2 text-lg px-8 py-4 shadow-xl shadow-violet-200"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 rounded-xl bg-white/60 backdrop-blur-md text-slate-700 font-semibold text-lg border border-white/60 hover:bg-white/80 hover:border-violet-300 hover:shadow-lg transition-all duration-300"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* What TrainPi Offers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-16">What TrainPi Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div key={i} className="card-premium p-8 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-4xl mb-6 bg-white/50 w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">{feature.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">{feature.desc}</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {
            [
              { icon: '🎓', title: 'Personalized Learning', desc: 'AI adapts to your learning style and pace' },
              { icon: '📈', title: 'Progress Tracking', desc: 'Monitor your growth with detailed analytics' },
              { icon: '🏆', title: 'Certifications', desc: 'Earn credentials recognized by employers' },
              { icon: '💼', title: 'Career Ready', desc: 'From learning to job-ready in one platform' }
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-6 text-center rounded-2xl hover:scale-105 transition-transform duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))
          }
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
        <div className="glass-panel-heavy rounded-[2.5rem] p-12 lg:p-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="p-4">
              <div className="text-5xl lg:text-6xl font-bold text-white mb-2 drop-shadow-sm">10K+</div>
              <div className="text-indigo-100 font-medium">Active Learners</div>
            </div>
            <div className="p-4">
              <div className="text-5xl lg:text-6xl font-bold text-white mb-2 drop-shadow-sm">500+</div>
              <div className="text-indigo-100 font-medium">Courses Available</div>
            </div>
            <div className="p-4">
              <div className="text-5xl lg:text-6xl font-bold text-white mb-2 drop-shadow-sm">95%</div>
              <div className="text-indigo-100 font-medium">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-32 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-3xl opacity-20 rounded-full"></div>
          <div className="relative glass-panel rounded-3xl p-12 lg:p-16 border-t border-white/60">
            <h2 className="text-4xl font-bold text-slate-900 mb-6">Ready to Start Your Journey?</h2>
            <p className="text-slate-600 mb-10 text-lg leading-relaxed max-w-2xl mx-auto">
              Join thousands of learners who are transforming their careers with TrainPi.
              Create your free account and discover your path to success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-10 py-4 shadow-xl shadow-fuchsia-200">
                Create Free Account →
              </Link>
              <Link href="/login" className="px-10 py-4 rounded-xl bg-white text-slate-700 font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
