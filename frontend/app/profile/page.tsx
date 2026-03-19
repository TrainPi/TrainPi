'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authAPI, resumeAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Camera, Save, User as UserIcon, MapPin, Globe, Github, Linkedin, Briefcase, FileText, Upload, Loader2, CheckCircle2, Sparkles, Target } from 'lucide-react'

interface ResumeAnalysis {
  recommended_career: string
  skills_found: string[]
  match_score: number
  summary: string
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [analyzingResume, setAnalyzingResume] = useState(false)
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    github_url: '',
    profile_image: ''
  })

  useEffect(() => {
    setMounted(true)
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        headline: user.headline || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        linkedin_url: user.linkedin_url || '',
        github_url: user.github_url || '',
        profile_image: user.profile_image || ''
      })
    }
  }, [user, isAuthenticated, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading('Uploading image...')
    try {
      const res = await authAPI.uploadAvatar(file)
      setFormData(prev => ({ ...prev, profile_image: res.url }))
      await authAPI.updateProfile({ profile_image: res.url })
      toast.success('Profile picture updated!', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Failed to upload image', { id: toastId })
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await authAPI.updateProfile(formData)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx?)$/i)) {
      toast.error('Please upload a PDF or DOCX file.')
      return
    }
    setResumeFile(file)
    setResumeAnalysis(null)
    setResumeError(null)
  }

  const handleAnalyzeResume = async () => {
    if (!resumeFile) {
      toast.error('Select a resume file first.')
      return
    }
    setAnalyzingResume(true)
    setResumeError(null)
    setResumeAnalysis(null)
    const toastId = toast.loading('Analyzing your resume with AI...')
    try {
      const result = await resumeAPI.uploadResume(resumeFile)
      if (result?.success && result?.analysis) {
        setResumeAnalysis(result.analysis)
        toast.success('Resume analyzed successfully!', { id: toastId })
      } else {
        const errMsg = 'AI could not analyze the resume. Try again or use a different file.'
        setResumeError(errMsg)
        toast.error(errMsg, { id: toastId })
      }
    } catch (error: any) {
      console.error('Resume analysis error:', error)
      const detail = error?.response?.data?.detail || error?.message || 'Resume analysis failed.'
      setResumeError(detail)
      toast.error(detail, { id: toastId })
      if (error?.response?.status === 402 || /credit|quota/i.test(detail)) {
        toast('Add your Gemini key or buy credits at Manage Credits.', { icon: 'i', duration: 5000 })
      }
    } finally {
      setAnalyzingResume(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo />
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600 transition">Dashboard</Link>
              <Link href="/learn" className="text-gray-700 hover:text-indigo-600 transition">Learn</Link>
              <Link href="/career" className="text-gray-700 hover:text-indigo-600 transition">Career</Link>
              <Link href="/profile" className="text-indigo-600 font-semibold border-b-2 border-indigo-600">Profile</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg relative flex items-center justify-center">
                  {formData.profile_image ? (
                    <img
                      src={formData.profile_image.startsWith('http') ? formData.profile_image : `http://127.0.0.1:8000${formData.profile_image}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon size={48} className="text-gray-400" />
                  )}
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-secondary flex items-center gap-2">
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
                    {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>

            <div>
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                      <input type="text" value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Senior Software Engineer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. San Francisco, CA" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                      <input type="text" value={formData.linkedin_url} onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                      <input type="text" value={formData.github_url} onChange={(e) => setFormData({ ...formData, github_url: e.target.value })} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Experience Summary</label>
                    <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32" placeholder="Tell us about your professional background..." />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{formData.full_name || 'My Profile'}</h1>
                    <p className="text-xl text-gray-600">{formData.headline || 'No headline set'}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    {formData.location && (<div className="flex items-center gap-1"><MapPin size={16} /> {formData.location}</div>)}
                    {formData.website && (<a href={formData.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600"><Globe size={16} /> Website</a>)}
                    {formData.github_url && (<a href={formData.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600"><Github size={16} /> GitHub</a>)}
                    {formData.linkedin_url && (<a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-600"><Linkedin size={16} /> LinkedIn</a>)}
                  </div>
                  <div className="pt-6 border-t">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <Briefcase size={20} className="text-indigo-600" />
                      About & Experience
                    </h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {formData.bio || 'No bio added yet. Click Edit Profile to add a summary of your experience.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resume Analysis Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <FileText size={24} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resume Analysis</h2>
                <p className="text-gray-500 text-sm">Upload your resume (PDF or DOCX) and TrainPi AI will extract skills and recommend a career path.</p>
              </div>
            </div>

            {/* Upload area */}
            <div className="mb-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
              >
                <Upload size={32} className="mx-auto text-gray-400 group-hover:text-indigo-500 transition-colors mb-3" />
                {resumeFile ? (
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{resumeFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(resumeFile.size / 1024).toFixed(0)} KB - Click to change</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-gray-700">Click to select your resume</p>
                    <p className="text-sm text-gray-500 mt-1">Supports PDF and DOCX files</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleResumeSelect}
                />
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyzeResume}
              disabled={!resumeFile || analyzingResume}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
            >
              {analyzingResume ? (
                <><Loader2 size={20} className="animate-spin" /> Analyzing with AI...</>
              ) : (
                <><Sparkles size={20} /> Analyze Resume</>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-3">Uses 5 credits or your own Gemini API key.</p>

            {/* Error */}
            {resumeError && (
              <div className="mt-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm">
                {resumeError}
              </div>
            )}

            {/* Results */}
            {resumeAnalysis && (
              <div className="mt-8 space-y-6 animate-fade-in">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={20} />
                  <span className="font-bold">Analysis complete</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Recommended Career */}
                  <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={18} className="text-indigo-600" />
                      <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Recommended Career</p>
                    </div>
                    <p className="text-2xl font-black text-gray-900">{resumeAnalysis.recommended_career}</p>
                  </div>

                  {/* Match Score */}
                  <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/50">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-3">Match Score</p>
                    <div className="flex items-end gap-2">
                      <p className="text-5xl font-black text-gray-900">{resumeAnalysis.match_score}</p>
                      <p className="text-lg font-bold text-gray-400 mb-1">/ 100</p>
                    </div>
                    <div className="mt-3 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, resumeAnalysis.match_score)}%` }} />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/50">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">AI Summary</p>
                    <p className="text-gray-700 leading-relaxed">{resumeAnalysis.summary}</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="p-6 rounded-2xl border border-gray-200">
                  <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Skills Found ({resumeAnalysis.skills_found.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {resumeAnalysis.skills_found.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/career"
                    className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                  >
                    Explore {resumeAnalysis.recommended_career} path
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                  >
                    Go to dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
