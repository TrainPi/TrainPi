'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { lessonsAPI, dashboardAPI } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LessonDetailPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const lessonId = parseInt(params.id as string)
  const [lesson, setLesson] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadLesson()
  }, [isAuthenticated, router, lessonId])

  const loadLesson = async () => {
    try {
      const data = await lessonsAPI.getLesson(lessonId)
      setLesson(data)
    } catch (error: any) {
      toast.error('Failed to load lesson')
      router.push('/learn')
    } finally {
      setLoading(false)
    }
  }

  const handleModuleComplete = async () => {
    if (!lesson) return

    const progress = ((currentModule + 1) / lesson.modules.length) * 100
    try {
      await dashboardAPI.updateProgress({
        lesson_id: lessonId,
        progress_type: 'lesson',
        completion_percentage: progress,
        time_spent_minutes: 5,
      })
      
      if (currentModule < lesson.modules.length - 1) {
        setCurrentModule(currentModule + 1)
        toast.success('Module completed!')
      } else {
        toast.success('Lesson completed!')
      }
    } catch (error: any) {
      toast.error('Failed to update progress')
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

          {/* Quiz Section (if available) */}
          {lesson.quiz_questions && lesson.quiz_questions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-8">
              <h2 className="text-2xl font-bold mb-4">Quiz</h2>
              <p className="text-gray-600 mb-4">
                Test your understanding with these questions.
              </p>
              <Link
                href={`/learn/${lessonId}/quiz`}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Start Quiz
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

