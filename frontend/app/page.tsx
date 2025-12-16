'use client'

import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Logo from '@/components/Logo'

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
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [hydrated, isAuthenticated, router])

  const showAuthCTA = !hydrated || !isAuthenticated

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              {showAuthCTA ? (
                <Link href="/login" className="btn-secondary">
                  Signup/Login
                </Link>
              ) : (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">
                    Dashboard
                  </Link>
                  <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition">
                    Learn
                  </Link>
                  <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition">
                    Career
                  </Link>
                  <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition">
                    Profile
                  </Link>
                  <Link href="/dashboard" className="btn-primary">
                    Go to Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6">
            <span>Train</span>
            <span className="text-yellow-500">Pi</span>
            <br />
            <span className="text-gray-900 text-4xl md:text-5xl">AI-Powered Learning Platform</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your career with AI-powered micro-lessons, personalized career paths, smart resume building, and intelligent progress tracking. From self-discovery to career readiness.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              Get Started
            </Link>
            <Link href="/login" className="btn-primary text-lg px-8 py-4">
              Demo
            </Link>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">What TrainPi Offers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {offerings.map((offering, index) => (
              <div
                key={offering.title}
                className="card-modern p-6 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-5xl mb-4">{offering.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{offering.title}</h3>
                <p className="text-gray-600 mb-4">{offering.description}</p>
                <ul className="space-y-2">
                  {offering.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-indigo-600 mt-1"></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {highlights.map((highlight, index) => (
            <div
              key={highlight.title}
              className="card-modern p-6 text-center animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-4">{highlight.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{highlight.title}</h3>
              <p className="text-gray-600">{highlight.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl p-12 mb-20 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-gray-600">Active Learners</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">500+</div>
              <div className="text-gray-600">Courses Available</div>
            </div>
            <div>
              <div className="text-5xl font-bold gradient-text mb-2">95%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="card-modern p-12 max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Start Your Journey?</h2>
            <p className="text-gray-600 mb-8 text-lg">Join thousands of learners transforming their careers with TrainPi.</p>
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-4">
                Create Free Account
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                Signup/Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
