'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authAPI, resumeAPI } from '../../lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  Camera,
  Save,
  User as UserIcon,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Briefcase,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  Target,
  AlertTriangle,
  Gauge,
} from 'lucide-react'
import type { ReadinessLevel } from '@/lib/demoData'

interface ResumeAnalysis {
  recommended_career: string
  skills_found: string[]
  match_score: number
  summary: string
  operational_readiness_level?: ReadinessLevel
  operational_strengths?: string[]
  operational_gaps?: string[]
  priority_gap?: string
}

const LEVEL_COLOR: Record<ReadinessLevel, string> = {
  Beginner: 'text-rose-600 bg-rose-50',
  Developing: 'text-amber-600 bg-amber-50',
  Operational: 'text-emerald-600 bg-emerald-50',
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [analyzingResume, setAnalyzingResume] = useState(false)
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysis | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    bio: '',
    location: '',
    website: '',
    linkedin_url: '',
    github_url: '',
    profile_image: '',
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
        headline: user.headline || 'Aspiring Cybersecurity Analyst',
        bio: user.bio || 'IT support professional building cybersecurity operational fluency. Strong Windows background, phishing-aware, working on Linux and IAM workflows.',
        location: user.location || 'Remote · USA',
        website: user.website || '',
        linkedin_url: user.linkedin_url || '',
        github_url: user.github_url || '',
        profile_image: user.profile_image || '',
      })
    }
  }, [user, isAuthenticated, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const toastId = toast.loading('Uploading image…')
    try {
      const res = await authAPI.uploadAvatar(file)
      setFormData((prev) => ({ ...prev, profile_image: res.url }))
      await authAPI.updateProfile({ profile_image: res.url })
      toast.success('Profile picture updated', { id: toastId })
    } catch {
      toast.error('Failed to upload image', { id: toastId })
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await authAPI.updateProfile(formData)
      setIsEditing(false)
      toast.success('Profile saved')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeFile(file)
    setResumeAnalysis(null)
    setResumeError(null)
  }

  const handleAnalyzeResume = async () => {
    if (!resumeFile) {
      toast.error('Select a resume first.')
      return
    }
    setAnalyzingResume(true)
    setResumeError(null)
    setResumeAnalysis(null)
    const toastId = toast.loading('Analyzing operational readiness…')
    try {
      const result = await resumeAPI.uploadResume(resumeFile)
      if (result?.success && result?.analysis) {
        setResumeAnalysis(result.analysis as ResumeAnalysis)
        toast.success('Operational analysis complete', { id: toastId })
      } else {
        setResumeError('Could not analyze the resume.')
        toast.error('Analysis failed', { id: toastId })
      }
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Resume analysis failed.'
      setResumeError(detail)
      toast.error(detail, { id: toastId })
    } finally {
      setAnalyzingResume(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Header card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22><circle cx=%2260%22 cy=%2260%22 r=%2255%22 fill=%22none%22 stroke=%22white%22 stroke-opacity=%220.05%22 stroke-width=%221%22/></svg>')] opacity-50" />
        </div>
        <div className="px-6 sm:px-8 pb-8">
          <div className="relative flex flex-wrap justify-between items-end -mt-12 mb-6 gap-4">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-lg relative flex items-center justify-center">
                {formData.profile_image ? (
                  <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon size={44} className="text-slate-400" />
                )}
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white" size={22} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition">
                Edit profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={handleSave} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 disabled:opacity-50">
                  {loading ? 'Saving…' : <><Save size={14} /> Save</>}
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Full Name" value={formData.full_name} onChange={(v) => setFormData({ ...formData, full_name: v })} />
              <Input label="Headline" value={formData.headline} onChange={(v) => setFormData({ ...formData, headline: v })} placeholder="e.g. Aspiring SOC Analyst" />
              <Input label="Location" value={formData.location} onChange={(v) => setFormData({ ...formData, location: v })} />
              <Input label="Website" value={formData.website} onChange={(v) => setFormData({ ...formData, website: v })} placeholder="https://" />
              <Input label="LinkedIn" value={formData.linkedin_url} onChange={(v) => setFormData({ ...formData, linkedin_url: v })} />
              <Input label="GitHub" value={formData.github_url} onChange={(v) => setFormData({ ...formData, github_url: v })} />
              <div className="md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 outline-none h-28 font-medium"
                  placeholder="Tell us about your operational background…"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{formData.full_name || 'Your Profile'}</h1>
              <p className="text-base font-bold text-slate-600">{formData.headline}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 font-medium">
                {formData.location && <span className="flex items-center gap-1"><MapPin size={14} /> {formData.location}</span>}
                {formData.website && <a href={formData.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600"><Globe size={14} /> Website</a>}
                {formData.github_url && <a href={formData.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600"><Github size={14} /> GitHub</a>}
                {formData.linkedin_url && <a href={formData.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-indigo-600"><Linkedin size={14} /> LinkedIn</a>}
              </div>
              <div className="pt-5 border-t border-slate-100">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-2">
                  <Briefcase size={14} className="text-indigo-600" /> Operational Background
                </p>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{formData.bio}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Operational Analysis */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">Operational Resume Analysis</h2>
              <p className="text-sm text-slate-500">Upload your resume — TrainPi assesses your operational readiness, not just skills.</p>
            </div>
          </div>

          <div className="mb-5">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-3xl p-8 text-center cursor-pointer transition-colors group bg-slate-50/40"
            >
              <Upload size={30} className="mx-auto text-slate-400 group-hover:text-indigo-500 transition mb-3" />
              {resumeFile ? (
                <>
                  <p className="text-base font-black text-slate-900">{resumeFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{(resumeFile.size / 1024).toFixed(0)} KB — click to change</p>
                </>
              ) : (
                <>
                  <p className="text-base font-black text-slate-700">Select your resume</p>
                  <p className="text-xs text-slate-500 mt-1">PDF or DOCX</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeSelect}
              />
            </div>
          </div>

          <button
            onClick={handleAnalyzeResume}
            disabled={!resumeFile || analyzingResume}
            className="px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-40 inline-flex items-center gap-2 shadow-lg shadow-indigo-200 text-sm"
          >
            {analyzingResume ? (
              <><Loader2 size={16} className="animate-spin" /> Analyzing operational readiness…</>
            ) : (
              <><Sparkles size={16} /> Analyze for operational readiness</>
            )}
          </button>

          {resumeError && (
            <div className="mt-5 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium">
              {resumeError}
            </div>
          )}

          {resumeAnalysis && (
            <div className="mt-8 space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={18} />
                <span className="font-black text-sm">Operational analysis complete</span>
              </div>

              {/* Top metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/40">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={14} className="text-indigo-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Best-fit Role</p>
                  </div>
                  <p className="text-xl font-black text-slate-900">{resumeAnalysis.recommended_career}</p>
                </div>
                <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/40">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Match Score</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl font-black text-slate-900 tabular-nums">{resumeAnalysis.match_score}</p>
                    <p className="text-sm font-bold text-slate-400 mb-1">/ 100</p>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${resumeAnalysis.match_score}%` }} />
                  </div>
                </div>
                {resumeAnalysis.operational_readiness_level && (
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                      <Gauge size={12} /> Op. Readiness Level
                    </p>
                    <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${LEVEL_COLOR[resumeAnalysis.operational_readiness_level]}`}>
                      {resumeAnalysis.operational_readiness_level}
                    </span>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-5 rounded-2xl border border-slate-100 bg-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed">{resumeAnalysis.summary}</p>
              </div>

              {/* Strengths + Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumeAnalysis.operational_strengths && (
                  <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3">Operational Strengths</p>
                    <ul className="space-y-2">
                      {resumeAnalysis.operational_strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-emerald-900">
                          <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {resumeAnalysis.operational_gaps && (
                  <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-700 mb-3">Operational Gaps</p>
                    <ul className="space-y-2">
                      {resumeAnalysis.operational_gaps.map((g, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-rose-900">
                          <AlertTriangle size={14} className="text-rose-600 mt-0.5 shrink-0" />
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Priority gap */}
              {resumeAnalysis.priority_gap && (
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Priority Gap to Close First</p>
                      <p className="text-sm text-amber-900 font-bold leading-snug">{resumeAnalysis.priority_gap}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills */}
              <div className="p-5 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Skills Detected ({resumeAnalysis.skills_found.length})</p>
                <div className="flex flex-wrap gap-2">
                  {resumeAnalysis.skills_found.map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/dashboard/readiness"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
                >
                  <Gauge size={16} />
                  See full readiness score
                </Link>
                <Link
                  href="/scenarios"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition"
                >
                  <Target size={16} />
                  Practice scenarios
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 outline-none font-medium text-sm"
      />
    </div>
  )
}
