'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { dashboardAPI, chatAPI, careerAPI } from '../../lib/api'
import CareerSelectionModal from '../../components/dashboard/CareerSelectionModal'
import WeeklyGoalModal from '../../components/dashboard/WeeklyGoalModal'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '../../components/Logo'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'


interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function DashboardPage() {
  const { isAuthenticated, clearAuth, user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCareerModal, setShowCareerModal] = useState(false)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadDashboard()
  }, [isAuthenticated, router])

  const loadDashboard = async () => {
    try {
      const data = await dashboardAPI.getStats()
      setStats(data)
      // Trigger onboarding if no career path selected
      if (!data.career_path) {
        setShowCareerModal(true)
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleCareerSelect = async (careerPath: string) => {
    setIsSettingUp(true)
    try {
      await careerAPI.selectCareer(careerPath)
      toast.success(`Career path selected: ${careerPath}`)
      setShowCareerModal(false)
      // Reload stats to reflect changes (mock API will now return populated stats)
      await loadDashboard()
    } catch (error) {
      console.error('Failed to select career:', error)
      toast.error('Failed to save career selection')
    } finally {
      setIsSettingUp(false)
    }
  }

  const handleGoalSet = (goal: number) => {
    toast.success(`Weekly goal set to ${goal} lessons!`)
    setShowGoalModal(false)
    // Here we would call an API, but for now just toast UI
  }

  const handleSignOut = () => {
    clearAuth()
    router.push('/')
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMsg = inputMessage
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInputMessage('')
    setIsChatLoading(true)

    try {
      const data = await chatAPI.sendMessage(userMsg)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to send message')
    } finally {
      setIsChatLoading(false)
    }
  }

  if (loading) {
    return ( <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-xl">Loading...</div></div> )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || user?.email?.split('@')[0] || 'Learner'}! 👋
          </h1>
          <p className="text-gray-600">Here's your learning progress overview</p>
        </div>
        <Link href="/career" className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-indigo-200">
          <span>🎯</span> Update Career Path
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.courses_completed || '-'}</h3>
          <p className="text-gray-500 font-medium pb-1">Courses Completed</p>
          {(stats?.courses_completed === 0 || !stats?.courses_completed) && (
            <p className="text-xs text-slate-400">Start your first course to begin</p>
          )}
        </div>

        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.lessons_in_progress || '-'}</h3>
          <p className="text-gray-500 font-medium pb-1">Lessons in Progress</p>
          {!stats?.career_path ? (
            <p className="text-xs text-slate-400">Pick a career path to unlock lessons</p>
          ) : (stats?.lessons_in_progress === 0 && (
            <p className="text-xs text-slate-400">Resume learning to see progress</p>
          ))}
        </div>

        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {!stats?.career_path ? '-' : (stats?.skills_acquired || 0)}
          </h3>
          <p className="text-gray-500 font-medium pb-1">Skills Acquired</p>
          {!stats?.career_path && (
            <p className="text-xs text-slate-400">Available after selecting a career path</p>
          )}
        </div>

        <div className="card-premium p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats?.lessons_completed || 0}</h3>
          <p className="text-gray-500 font-medium pb-1">Lessons Completed</p>
          <p className="text-xs text-slate-400">From practice & AI learning modules</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Career Path Progress */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Career Path Progress</h2>
              <Link href="/roadmap" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                View Full Roadmap <ArrowRight size={16} />
              </Link>
            </div>
            {!stats?.career_path ? (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                <div>
                  <span className="text-gray-700 font-medium block mb-1">Not Selected</span>
                  <p className="text-gray-500 text-sm">Choose a career path to unlock a personalized roadmap.</p>
                </div>
                <button
                  onClick={() => setShowCareerModal(true)}
                  className="btn-primary px-6 py-2 whitespace-nowrap"
                >
                  Select Career Path →
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">{stats?.career_path}</span>
                  <span className="text-gray-600">{stats?.roadmap_completion || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${stats?.roadmap_completion || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Fundamentals</span>
                  <span>Specialization</span>
                  <span>Job Readiness</span>
                </div>
              </div>
            )}
          </div>

          {/* My Lessons */}
          <div className="card-premium p-6">
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
          <div className="card-premium p-6">
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
          <div className="card-premium p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Suggested Next Steps</h2>
            <div className="space-y-4">

              {/* Step 1: Select Career */}
              <div className={`p-4 rounded-xl border transition-all ${stats?.career_path
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-white border-indigo-200 shadow-sm ring-2 ring-indigo-50'
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-1 ${stats?.career_path ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                    <ArrowRight size={12} className={stats?.career_path ? "hidden" : "block"} />
                    <div className={stats?.career_path ? "block" : "hidden"}>✓</div>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${stats?.career_path ? 'text-emerald-900' : 'text-gray-900'}`}>
                      Select a career path
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {stats?.career_path ? "Completed Today" : "Unlock your personalized roadmap"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: First Lesson */}
              <div className={`p-4 rounded-xl border transition-all ${!stats?.career_path ? 'opacity-50 grayscale' : 'bg-white border-gray-100'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">
                    ⏳
                  </div>
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900">Complete your first lesson</h4>
                    <p className="text-sm text-gray-500 mt-1">(10-15 min)</p>
                    {stats?.career_path && (
                      <button className="mt-3 w-full btn-primary py-2 text-sm">Start First Lesson ›</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 3: Weekly Goal */}
              <div className={`p-4 rounded-xl border transition-all ${!stats?.career_path ? 'opacity-50 grayscale' : 'bg-white border-gray-100'
                }`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-amber-500">
                    ⏳
                  </div>
                  <div className="w-full">
                    <h4 className="font-semibold text-gray-900">Set a weekly goal</h4>
                    <p className="text-sm text-gray-500 mt-1">(e.g. 3 lessons)</p>
                    {stats?.career_path && (
                      <button
                        onClick={() => setShowGoalModal(true)}
                        className="mt-3 w-full bg-indigo-100 text-indigo-700 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors"
                      >
                        Set Weekly Goal ›
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>


        </div>
      </div>

      {/* AI Mentor Chat Section */}
      <div className="mt-8 mb-12">
        <div className="card-premium p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Image src="/aa.png" alt="AI Mentor" width={64} height={64} className="object-contain" />
            <span>AI Career Mentor</span>
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[400px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="mb-4 relative w-32 h-32">
                    <Image src="/aa.png" alt="AI Mentor" fill className="object-contain" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">AI Career Mentor</h3>
                  <p className="text-gray-500 mb-6 max-w-md">
                    Tell me your goals — I'll build a learning plan for you.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      onClick={() => { setInputMessage("Help me choose a career path"); }}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-full hover:bg-indigo-100 transition-colors"
                    >
                      ✨ Help me choose a career path
                    </button>
                    <button
                      onClick={() => { setInputMessage("Create a weekly plan"); }}
                      className="px-4 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-full hover:bg-purple-100 transition-colors"
                    >
                      📅 Create a weekly plan
                    </button>
                    <button
                      onClick={() => { setInputMessage("What skills should I learn first?"); }}
                      className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full hover:bg-emerald-100 transition-colors"
                    >
                      📚 What skills should I learn first?
                    </button>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-2 rounded-bl-none">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask for advice..."
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={isChatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !inputMessage.trim()}
                  className="btn-primary px-6"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CareerSelectionModal
        isOpen={showCareerModal}
        onClose={() => { /* Force selection or handle skip? For now, keep it required as per instructions */ }}
        onSelect={handleCareerSelect}
        isLoading={isSettingUp}
      />
      <WeeklyGoalModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        onConfirm={handleGoalSet}
      />
    </div>
  )
}