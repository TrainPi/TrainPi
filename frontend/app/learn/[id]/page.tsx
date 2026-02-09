'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { lessonsAPI, dashboardAPI, aiFeaturesAPI } from '../../../lib/api'
import { getLessonById } from '../../../lib/lessonsStorage'
import { MOCK_ONLY } from '../../../lib/mockConfig'
import toast from 'react-hot-toast'
import Link from 'next/link'

function ensureModules(lesson: any) {
  const modules = lesson?.modules
  if (modules && modules.length > 0) return lesson
  return {
    ...lesson,
    modules: [
      {
        title: lesson?.title || 'Overview',
        content: (lesson?.description as string) || 'Work through this lesson at your own pace. Content can be expanded when connected to the backend.',
        duration_minutes: 5,
        key_takeaways: ['Complete the lesson to track progress.']
      }
    ]
  }
}

export default function LessonDetailPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const lessonId = parseInt(params.id as string)
  const [lesson, setLesson] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadLesson()
  }, [isAuthenticated, router, lessonId])

  const loadLesson = async () => {
    if (!MOCK_ONLY) {
      try {
        const data = await lessonsAPI.getLesson(lessonId)
        setLesson(ensureModules(data))
        setLoading(false)
        return
      } catch (_) {
        // Fall back to local/demo
      }
    }
    const stored = getLessonById(lessonId)
    if (stored) {
      setLesson(ensureModules(stored))
    } else {
      toast.error('Lesson not found')
      router.push('/learn')
    }
    setLoading(false)
  }

  const handleGenerateQuiz = async () => {
    if (!lesson) return
    setGeneratingQuiz(true)
    try {
      const context = lesson.modules?.[0]?.content
        ? String(lesson.modules[0].content).slice(0, 1200)
        : undefined
      const { quiz_questions } = await aiFeaturesAPI.generateQuiz({
        lesson_title: lesson.title,
        context,
      })
      if (!quiz_questions?.length) {
        toast.error('No quiz questions generated')
        return
      }
      await lessonsAPI.updateQuiz(lessonId, quiz_questions)
      await loadLesson()
      toast.success(`Quiz created: ${quiz_questions.length} questions. Uses credits or your Gemini key.`)
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? e.message ?? 'Failed to generate quiz'
      toast.error(msg)
      if (e.response?.status === 402 || /credit|quota/i.test(String(msg))) {
        toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' })
      }
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleModuleComplete = async () => {
    if (!lesson) return
    const mods = lesson.modules || []
    if (currentModule < mods.length - 1) {
      setCurrentModule(currentModule + 1)
      toast.success('Module completed!')
    } else {
      toast.success('Lesson completed!')
    }
    if (!MOCK_ONLY) {
      try {
        await dashboardAPI.updateProgress({
          lesson_id: lessonId,
          progress_type: 'lesson',
          completion_percentage: ((currentModule + 1) / mods.length) * 100,
          time_spent_minutes: mods[currentModule]?.duration_minutes || 5
        })
      } catch (_) {}
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!lesson) {
    return null
  }

  const module = lesson.modules?.[currentModule]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text">TrainPi</Link>
          <div className="flex items-center gap-6">
            <Link href="/learn" className="text-gray-700 hover:text-gray-900">← Back to Lessons</Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{lesson.title}</h1>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">
                Module {currentModule + 1} of {lesson.modules.length}
              </span>
              <span className="text-sm font-semibold">
                {Math.round(((currentModule + 1) / lesson.modules.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${((currentModule + 1) / lesson.modules.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Module Content */}
          {module && (
            <div className="bg-white rounded-lg shadow p-8 mb-6">
              <h2 className="text-2xl font-bold mb-4">{module.title}</h2>
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700 whitespace-pre-line">{module.content}</p>
              </div>

              {module.key_takeaways && module.key_takeaways.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-2">Key Takeaways:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {module.key_takeaways.map((takeaway: string, index: number) => (
                      <li key={index} className="text-gray-700">{takeaway}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Estimated time: {module.duration_minutes} minutes
                </div>
                <button
                  onClick={handleModuleComplete}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
                >
                  {currentModule < lesson.modules.length - 1 ? 'Next Module →' : 'Complete Lesson'}
                </button>
              </div>
            </div>
          )}

          {/* Quiz Section */}
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">Quiz</h2>
            {lesson.quiz_questions && lesson.quiz_questions.length > 0 ? (
              <>
                <p className="text-gray-600 mb-4">
                  Test your understanding ({lesson.quiz_questions.length} questions).
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/learn/${lessonId}/quiz`}
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Start Quiz
                  </Link>
                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={generatingQuiz}
                    className="px-6 py-3 rounded-lg border border-violet-300 text-violet-700 font-medium hover:bg-violet-50 disabled:opacity-60"
                  >
                    {generatingQuiz ? 'Generating…' : 'Generate new quiz with AI'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">AI quiz uses 3 credits or your Gemini key.</p>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-4">No quiz yet. Generate one with AI (uses credits or your Gemini key).</p>
                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="inline-block bg-violet-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-60"
                >
                  {generatingQuiz ? 'Generating…' : 'Create quiz with AI'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

