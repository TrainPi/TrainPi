'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { lessonsAPI } from '@/lib/api'
import { getLessonById } from '@/lib/lessonsStorage'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RotateCcw, Trophy } from 'lucide-react'

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

function isCorrect(q: QuizQ, answer: string | undefined): boolean {
  if (!answer) return false
  return String(answer).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
}

export default function LessonQuizPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  const lessonId = parseInt(params.id as string, 10)

  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [textAnswer, setTextAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return }
    if (isNaN(lessonId)) { toast.error('Invalid lesson'); router.push('/learn'); return }
    loadLesson()
  }, [isAuthenticated, lessonId])

  const loadLesson = async () => {
    setLoading(true)
    if (!MOCK_ONLY) {
      try {
        const data = await lessonsAPI.getLesson(lessonId)
        setLesson(ensureModules(data))
        setLoading(false)
        return
      } catch { /* fall through */ }
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

  const questions: QuizQ[] = lesson?.quiz_questions ?? []
  const currentQ = questions[currentIndex]
  const hasNext = currentIndex < questions.length - 1
  const hasPrev = currentIndex > 0

  const commitTextAnswer = () => {
    if (textAnswer.trim()) setAnswers(prev => ({ ...prev, [currentIndex]: textAnswer.trim() }))
  }

  const handleNext = () => {
    commitTextAnswer()
    const next = currentIndex + 1
    setTextAnswer(answers[next] || '')
    setCurrentIndex(next)
  }

  const handlePrev = () => {
    commitTextAnswer()
    const prev = currentIndex - 1
    setTextAnswer(answers[prev] || '')
    setCurrentIndex(prev)
  }

  const handleSubmitQuiz = () => {
    commitTextAnswer()
    if (questions.length === 0) { toast('No questions in this quiz.'); return }
    const finalAnswers = { ...answers }
    if (textAnswer.trim()) finalAnswers[currentIndex] = textAnswer.trim()
    let correct = 0
    questions.forEach((q, i) => { if (isCorrect(q, finalAnswers[i])) correct++ })
    setAnswers(finalAnswers)
    setScore(Math.round((correct / questions.length) * 100))
    setSubmitted(true)
    toast.success(`Score: ${correct}/${questions.length}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
          <p className="text-slate-500 font-medium">Loading quiz…</p>
        </div>
      </div>
    )
  }

  if (!lesson) return null

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-3xl">📝</div>
          <h2 className="text-xl font-black text-slate-900 mb-2">No quiz yet</h2>
          <p className="text-slate-500 text-sm mb-6">This lesson doesn't have quiz questions yet. Go back and generate them with AI.</p>
          <Link href={`/learn/${lessonId}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors">
            <ArrowLeft size={16} /> Back to lesson
          </Link>
        </div>
      </div>
    )
  }

  if (submitted && score !== null) {
    const correctCount = questions.filter((q, i) => isCorrect(q, answers[i])).length
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 sm:p-10 max-w-xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Trophy size={36} className="text-indigo-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">Quiz Complete!</h1>
            <p className="text-5xl font-black text-indigo-600 my-3">{score}%</p>
            <p className="text-slate-500">{correctCount} of {questions.length} correct</p>
            <p className="text-sm font-medium mt-2 text-slate-600">
              {score >= 80 ? '🎉 Excellent work! You\'ve mastered this lesson.' : score >= 60 ? '👍 Good effort! Review the lesson and try again.' : '📖 Review the lesson material and retake the quiz.'}
            </p>
          </div>

          {/* Answer review */}
          <div className="space-y-3 mb-8 max-h-80 overflow-y-auto pr-1">
            {questions.map((q, i) => {
              const correct = isCorrect(q, answers[i])
              return (
                <div key={i} className={`rounded-2xl p-4 border ${correct ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="flex items-start gap-2">
                    <span className={`shrink-0 mt-0.5 font-black text-sm ${correct ? 'text-emerald-600' : 'text-red-500'}`}>{correct ? '✓' : '✗'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{i + 1}. {q.question}</p>
                      <p className="text-xs text-slate-600 mt-0.5">Your answer: <span className="font-semibold">{answers[i] || '(skipped)'}</span></p>
                      {!correct && <p className="text-xs text-emerald-700 mt-0.5">Correct: <span className="font-semibold">{q.correct_answer}</span></p>}
                      {q.rationale && <p className="text-xs text-slate-500 mt-1 italic">{q.rationale}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => { setSubmitted(false); setScore(null); setAnswers({}); setCurrentIndex(0); setTextAnswer('') }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={15} /> Retake
            </button>
            <Link href={`/learn/${lessonId}`} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors">
              <CheckCircle2 size={15} /> Back to lesson
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isFillBlank = ['fill_blank', 'short_answer', 'text'].includes(currentQ?.type)
  const isTrueFalse = currentQ?.type === 'true_false'
  const isMCQ = !isFillBlank && !isTrueFalse
  const answered = isFillBlank ? !!textAnswer.trim() : !!answers[currentIndex]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* nav + progress */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href={`/learn/${lessonId}`} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors">
            <ArrowLeft size={16} /> Back to lesson
          </Link>
          <div className="text-center">
            <span className="text-sm font-black text-slate-900">{currentIndex + 1}</span>
            <span className="text-sm text-slate-400"> / {questions.length}</span>
          </div>
          <div className="w-20" />
        </div>
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* type badge + question */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isTrueFalse ? 'bg-blue-50 text-blue-600' : isFillBlank ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {isTrueFalse ? 'True / False' : isFillBlank ? 'Short Answer' : 'Multiple Choice'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-3 leading-snug">{currentQ?.question}</h2>
          </div>

          {/* answer options */}
          <div className="space-y-3">
            {isTrueFalse && ['True', 'False'].map(opt => (
              <label key={opt} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${answers[currentIndex] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                <input type="radio" name={`q-${currentIndex}`} checked={answers[currentIndex] === opt} onChange={() => setAnswers(prev => ({ ...prev, [currentIndex]: opt }))} className="sr-only" />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${answers[currentIndex] === opt ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                  {answers[currentIndex] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="font-semibold text-slate-900">{opt}</span>
              </label>
            ))}

            {isMCQ && (currentQ?.options?.length ? currentQ.options.map((opt: string, i: number) => (
              <label key={i} className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${answers[currentIndex] === opt ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'}`}>
                <input type="radio" name={`q-${currentIndex}`} checked={answers[currentIndex] === opt} onChange={() => setAnswers(prev => ({ ...prev, [currentIndex]: opt }))} className="sr-only" />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${answers[currentIndex] === opt ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                  {answers[currentIndex] === opt && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="font-medium text-slate-900">{opt}</span>
              </label>
            )) : (
              <textarea
                value={answers[currentIndex] || ''}
                onChange={e => setAnswers(prev => ({ ...prev, [currentIndex]: e.target.value }))}
                placeholder="Type your answer…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-slate-900 font-medium transition-colors"
              />
            ))}

            {isFillBlank && (
              <textarea
                value={textAnswer}
                onChange={e => setTextAnswer(e.target.value)}
                onBlur={commitTextAnswer}
                placeholder="Type your answer…"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-slate-900 font-medium transition-colors"
              />
            )}
          </div>

          {!answered && <p className="text-xs text-slate-400 mt-3">Select or type an answer to continue.</p>}

          {/* nav buttons */}
          <div className="flex items-center gap-3 mt-8">
            {hasPrev && (
              <button type="button" onClick={handlePrev} className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors">
                <ArrowLeft size={15} /> Prev
              </button>
            )}
            <div className="flex-1" />
            {hasNext ? (
              <button type="button" onClick={handleNext} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-colors">
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmitQuiz} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                <CheckCircle2 size={15} /> Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
