'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function LearnPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    loadLessons()
  }, [isAuthenticated, router])

  const loadLessons = async () => {
    // Load from localStorage (frontend-only mode)
    const userData = localStorage.getItem(`trainpi-user-${useAuthStore.getState().user?.id}`)
    const data = userData ? JSON.parse(userData) : {}
    setLessons(data.lessons || [])
    setLoading(false)
  }

  const handleCreateLesson = async () => {
    const title = prompt('Enter lesson title:')
    if (!title) return

    const newLesson = {
      id: Date.now(),
      title,
      modules: [],
      quiz_questions: [],
      created_at: new Date().toISOString()
    }

    const userData = localStorage.getItem(`trainpi-user-${useAuthStore.getState().user?.id}`)
    const data = userData ? JSON.parse(userData) : {}
    data.lessons = [...(data.lessons || []), newLesson]
    localStorage.setItem(`trainpi-user-${useAuthStore.getState().user?.id}`, JSON.stringify(data))
    
    toast.success('Lesson created!')
    loadLessons()
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const newLesson = {
      id: Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      modules: [{}, {}, {}],
      quiz_questions: [],
      created_at: new Date().toISOString()
    }

    const userData = localStorage.getItem(`trainpi-user-${useAuthStore.getState().user?.id}`)
    const data = userData ? JSON.parse(userData) : {}
    data.lessons = [...(data.lessons || []), newLesson]
    localStorage.setItem(`trainpi-user-${useAuthStore.getState().user?.id}`, JSON.stringify(data))
    
    toast.success('Document uploaded! Lesson created.')
    loadLessons()
    setShowUpload(false)
    setUploading(false)
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
              <Link href="/learn" className="text-indigo-600 font-semibold">Learn</Link>
              <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition">Career</Link>
              <Link href="/mentor" className="text-gray-700 hover:text-indigo-600 transition">Mentor</Link>
              <Link href="/profile" className="text-gray-700 hover:text-indigo-600 transition">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Lessons</h1>
            <p className="text-gray-600">Micro-learning modules generated from your documents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="btn-secondary"
            >
              📄 Upload Document
            </button>
            <button
              onClick={handleCreateLesson}
              className="btn-primary"
            >
              + Create Lesson
            </button>
          </div>
        </div>

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
              <div key={lesson.id} className="card-modern p-6">
                <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-4">
                  📖
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {lesson.modules?.length || 0} modules • {lesson.quiz_questions?.length || 0} quiz questions
                </p>
                <Link
                  href={`/learn/${lesson.id}`}
                  className="block w-full btn-primary text-center"
                >
                  View Lesson →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
