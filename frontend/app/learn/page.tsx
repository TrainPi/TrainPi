'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { getLessonsWithDefaults, addLesson } from '@/lib/lessonsStorage'
import { lessonsAPI, aiFeaturesAPI } from '@/lib/api'
import { MOCK_ONLY } from '@/lib/mockConfig'

export default function LearnPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showGenerateAI, setShowGenerateAI] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)

  const loadLessons = async () => {
    if (MOCK_ONLY) {
      setLessons(getLessonsWithDefaults())
      return
    }
    try {
      const data = await lessonsAPI.getMyLessons()
      const list = Array.isArray(data) ? data : (data?.lessons ?? [])
      setLessons(list.length ? list : getLessonsWithDefaults())
    } catch {
      setLessons(getLessonsWithDefaults())
    }
  }

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadLessons().finally(() => setLoading(false))
  }, [isAuthenticated, router])

  const handleCreateLesson = async () => {
    const title = prompt('Enter lesson title:')
    if (!title) return
    if (MOCK_ONLY) {
      addLesson({ title, modules: [], quiz_questions: [] })
      toast.success('Lesson created!')
      loadLessons()
      return
    }
    try {
      await lessonsAPI.create(title)
      toast.success('Lesson created!')
      await loadLessons()
    } catch (e: any) {
      toast.error(e.response?.data?.detail ?? 'Failed to create lesson')
    }
  }

  const handleGenerateLessonWithAI = async () => {
    const topic = aiTopic.trim()
    if (!topic) { toast.error('Please enter a topic first.'); return }
    setGeneratingAI(true)
    try {
      const generated = await aiFeaturesAPI.generateLesson(topic)
      if (!generated?.title || !Array.isArray(generated.modules)) {
        toast.error('AI could not generate a valid lesson.')
        return
      }
      await lessonsAPI.createFromAI({
        title: generated.title,
        modules: generated.modules,
        quiz_questions: generated.quiz_questions ?? [],
      })
      toast.success('Lesson created with AI!')
      setAiTopic('')
      setShowGenerateAI(false)
      await loadLessons()
    } catch (e: any) {
      const msg = e.response?.data?.detail ?? e.message ?? 'Failed to generate lesson'
      toast.error(msg)
      if (e.response?.status === 402 || /credit|quota/i.test(String(msg))) {
        toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' })
      }
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 20 MB.')
      e.target.value = ''
      return
    }
    setUploading(true)
    if (MOCK_ONLY) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      const title = file.name.replace(/\.[^/.]+$/, '')
      addLesson({
        title,
        modules: [
          { title: 'Overview', content: 'Auto-generated module from your uploaded document.', duration_minutes: 4 },
          { title: 'Key concepts', content: 'AI-extracted core ideas from the source material.', duration_minutes: 5 },
          { title: 'Apply it', content: 'Practice exercise tied to the operational workflow.', duration_minutes: 6 },
        ],
        quiz_questions: [],
      })
      toast.success('Document uploaded! Lesson created.')
      loadLessons()
      setShowUpload(false)
      setUploading(false)
      return
    }
    try {
      await lessonsAPI.uploadDocument(file)
      toast.success('Document uploaded! Lesson created.')
      await loadLessons()
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Upload failed')
    } finally {
      setShowUpload(false)
      setUploading(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-base text-slate-500">Loading lessons…</div>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">My Lessons</h1>
            <p className="text-slate-500 font-medium">Micro-learning modules built from documents you upload.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-secondary"
            >
              📄 Upload Document
            </button>
            <button
              onClick={() => setShowGenerateAI(!showGenerateAI)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700"
            >
              ✨ Generate lesson with AI
            </button>
            <button
              onClick={handleCreateLesson}
              className="btn-primary"
            >
              + Create Lesson
            </button>
          </div>
        </div>

        {showGenerateAI && (
          <div className="card-modern p-6 mb-6 border-2 border-violet-200 bg-violet-50/30">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate lesson with AI (Gemini)</h3>
            <p className="text-sm text-gray-600 mb-4">Uses 5 credits or your own Gemini key. Enter a topic and we’ll create a full lesson with modules and quiz.</p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. React Hooks, Python basics, System design"
                className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border border-gray-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
              />
              <button
                onClick={handleGenerateLessonWithAI}
                disabled={generatingAI}
                className="btn-primary disabled:opacity-60"
              >
                {generatingAI ? 'Generating…' : 'Generate'}
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateAI(false)}
                className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {showUpload && (
          <div className="card-modern p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a PDF, DOCX, or PowerPoint file. TrainPi will automatically convert it into interactive micro-lessons.
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.pptx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {uploading && <p className="text-sm text-gray-600 mt-2">Uploading and processing...</p>}
          </div>
        )}

        {lessons.length === 0 ? (
          <div className="card-modern p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600 mb-4 text-lg">No lessons yet. Create your first lesson to get started!</p>
            <p className="text-sm text-gray-500 mb-6">
              Upload a document (SOP, policy manual, whitepaper) or create a lesson manually
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUpload(true)}
                className="btn-secondary"
              >
                Upload Document
              </button>
              <button
                onClick={handleCreateLesson}
                className="btn-primary"
              >
                Create Lesson
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-indigo-200">
                  📖
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{lesson.title}</h3>
                <p className="text-xs text-slate-500 mb-4 font-medium">
                  {lesson.modules?.length || 0} modules · {lesson.quiz_questions?.length || 0} quiz questions
                </p>
                <Link
                  href={`/learn/${lesson.id}`}
                  className="block w-full text-center px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition"
                >
                  Open lesson →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
