'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { lessonsAPI } from '@/lib/api'
import { getLessonById } from '@/lib/lessonsStorage'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'

type QuizQ = {
  question: string
  type: string
  options?: string[] | null
  correct_answer: string
  rationale?: string
}

function ensureModules(lesson: any) {
  const modules = lesson?.modules
  if (modules && modules.length > 0) return lesson
  return { ...lesson, modules: [{ title: lesson?.title || 'Overview', content: '', duration_minutes: 5, key_takeaways: [] }] }
}

export default function LessonQuizPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const lessonId = parseInt(params.id as string)
  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadLesson()
  }, [isAuthenticated, router, lessonId])

  const loadLesson = async () => {
    if (MOCK_ONLY || typeof window !== 'undefined') {
      const stored = getLessonById(lessonId)
      if (stored) {
        setLesson(ensureModules(stored))
        setLoading(false)
        return
      }
    }
    if (!MOCK_ONLY) {
      try {
        const data = await lessonsAPI.getLesson(lessonId)
        setLesson(ensureModules(data))
      } catch {
        const stored = getLessonById(lessonId)
        if (stored) setLesson(ensureModules(stored))
        else {
          toast.error('Lesson not found')
          router.push('/learn')
        }
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const questions: QuizQ[] = lesson?.quiz_questions ?? []
  const currentQ = questions[currentIndex]
  const hasNext = currentIndex < questions.length - 1
  const hasPrev = currentIndex > 0

  const handleSubmitQuiz = () => {
    if (questions.length === 0) {
      toast('No quiz questions in this lesson.')
      return
    }
    let correct = 0
    questions.forEach((q, i) => {
      const a = answers[i]
      if (a && String(a).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) correct++
    })
    setScore(Math.round((correct / questions.length) * 100))
    setSubmitted(true)
    toast.success(`Score: ${correct}/${questions.length}`)
  }

  if (loading || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md text-center">
          <p className="text-gray-600 mb-4">This lesson has no quiz questions yet.</p>
          <Link href={`/learn/${lessonId}`} className="text-indigo-600 font-medium hover:underline">
            ← Back to lesson
          </Link>
        </div>
      </div>
    )
  }

  if (submitted && score !== null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm px-4 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link href="/learn" className="text-gray-700 hover:text-gray-900">← Back to Lessons</Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-gray-900">Dashboard</Link>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Quiz complete</h1>
            <p className="text-4xl font-black text-indigo-600 mb-6">{score}%</p>
            <p className="text-gray-600 mb-6">
              You got {Object.keys(answers).filter((_, i) => {
                const q = questions[i]
                const a = answers[i]
                return a && String(a).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
              }).length} out of {questions.length} correct.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => { setSubmitted(false); setScore(null); setAnswers({}); setCurrentIndex(0); }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Retake quiz
              </button>
              <Link href={`/learn/${lessonId}`} className="btn-primary">
                Back to lesson
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/learn/${lessonId}`} className="text-gray-700 hover:text-gray-900">← Back to lesson</Link>
          <span className="text-sm text-gray-500">Question {currentIndex + 1} of {questions.length}</span>
        </div>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6 md:p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{currentQ.question}</h2>
          <div className="space-y-3">
            {currentQ.type === 'true_false' && (
              <>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${currentIndex}`}
                    checked={answers[currentIndex] === 'True'}
                    onChange={() => setAnswers({ ...answers, [currentIndex]: 'True' })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${currentIndex}`}
                    checked={answers[currentIndex] === 'False'}
                    onChange={() => setAnswers({ ...answers, [currentIndex]: 'False' })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>False</span>
                </label>
              </>
            )}
            {(currentQ.type === 'mcq' || currentQ.type === 'multiple_choice') && (currentQ.options?.length ? (
              currentQ.options.map((opt: string, i: number) => (
                <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${currentIndex}`}
                    checked={answers[currentIndex] === opt}
                    onChange={() => setAnswers({ ...answers, [currentIndex]: opt })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>{opt}</span>
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No options defined. Type your answer below.</p>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            {hasPrev && (
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                ← Previous
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Next →
              </button>
            )}
            {!hasNext && (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Submit quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
