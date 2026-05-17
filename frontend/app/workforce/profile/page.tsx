'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, FileText, Plus, X, Lightbulb, ArrowRight, Loader2 } from 'lucide-react'
import StepProgressBar from '@/components/workforce/StepProgressBar'
import { getProfile, saveProfile, setCurrentStep, type ParticipantProfile } from '@/lib/workforceState'
import toast from 'react-hot-toast'

const YEARS_OPTIONS = [
    'Select',
    'Less than 1 year',
    '1-3 years',
    '3-5 years',
    '5-10 years',
    '10+ years',
] as const

export default function WorkforceProfilePage() {
    const router = useRouter()
    const fileRef = useRef<HTMLInputElement>(null)
    const skillRef = useRef<HTMLInputElement>(null)
    const [dragOver, setDragOver] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [form, setForm] = useState<ParticipantProfile>({
        current_job_title: '',
        years_experience: 'Select',
        primary_skills: [],
        additional_notes: '',
        resume_filename: null,
        resume_size_kb: null,
        uploaded_at: null,
    })
    const [skillInput, setSkillInput] = useState('')

    useEffect(() => {
        const existing = getProfile()
        if (existing) {
            setForm({
                ...existing,
                years_experience: existing.years_experience || 'Select',
            })
        }
        setCurrentStep(1)
    }, [])

    const handleFile = useCallback((file: File) => {
        if (!file) return
        setForm((f) => ({
            ...f,
            resume_filename: file.name,
            resume_size_kb: Math.round(file.size / 1024),
            uploaded_at: new Date().toISOString(),
        }))
        toast.success(`Resume "${file.name}" selected`)
    }, [])

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) handleFile(f)
    }

    const addSkill = () => {
        const s = skillInput.trim()
        if (!s) return
        if (form.primary_skills.length >= 10) {
            toast.error('Maximum 10 skills')
            return
        }
        if (form.primary_skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
            toast.error('Already added')
            setSkillInput('')
            return
        }
        setForm((f) => ({ ...f, primary_skills: [...f.primary_skills, s] }))
        setSkillInput('')
        setTimeout(() => skillRef.current?.focus(), 50)
    }

    const removeSkill = (s: string) => {
        setForm((f) => ({ ...f, primary_skills: f.primary_skills.filter((x) => x !== s) }))
    }

    const handleContinue = () => {
        if (form.years_experience === 'Select') {
            toast.error('Please select your years of experience')
            return
        }
        setSubmitting(true)
        const cleaned: ParticipantProfile = {
            ...form,
            current_job_title: form.current_job_title.trim(),
            years_experience: form.years_experience,
            additional_notes: form.additional_notes.trim(),
        }
        saveProfile(cleaned)
        setCurrentStep(2)
        setTimeout(() => {
            toast.success('Profile saved')
            router.push('/workforce/operational-context')
        }, 500)
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 1 of 5: Participant Profile
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Let's start with your background. Upload your resume and tell us about your skills and experience.
                </p>
            </div>

            {/* Step progress bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <StepProgressBar currentStep={1} maxReachable={1} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
                {/* Main column */}
                <div className="space-y-6">
                    {/* Upload resume */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h2 className="font-black text-slate-900 mb-1">Upload Your Resume</h2>
                        <p className="text-xs text-slate-500 mb-4">Upload your resume to get started.</p>

                        <div
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            className={`rounded-2xl border-2 border-dashed transition-all p-8 sm:p-10 text-center cursor-pointer ${
                                dragOver
                                    ? 'border-violet-500 bg-violet-50'
                                    : form.resume_filename
                                    ? 'border-emerald-300 bg-emerald-50/40'
                                    : 'border-slate-200 bg-slate-50/40 hover:border-violet-300 hover:bg-violet-50/40'
                            }`}
                        >
                            {form.resume_filename ? (
                                <>
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                                        <FileText className="w-7 h-7" />
                                    </div>
                                    <p className="font-black text-slate-900 break-all">{form.resume_filename}</p>
                                    <p className="text-xs text-slate-500 mt-1">{form.resume_size_kb} KB · click to replace</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                                        <Upload className="w-7 h-7" />
                                    </div>
                                    <p className="font-black text-slate-900">Drag & drop your resume here</p>
                                    <p className="text-xs text-slate-500 mt-1">or</p>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                                        className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition shadow-md shadow-violet-200"
                                    >
                                        Choose File
                                    </button>
                                    <p className="text-[11px] text-slate-400 mt-3">PDF, DOCX (Max 20MB)</p>
                                </>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right column: form */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h2 className="font-black text-slate-900 mb-1">Tell Us About You</h2>
                        <p className="text-xs text-slate-500 mb-5">Add a few details to help us personalize your analysis.</p>

                        <div className="space-y-4">
                            <Field label="Current Job Title (Optional)">
                                <input
                                    type="text"
                                    value={form.current_job_title}
                                    onChange={(e) => setForm((f) => ({ ...f, current_job_title: e.target.value }))}
                                    placeholder="e.g., IT Support Specialist"
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none text-sm font-medium"
                                />
                            </Field>

                            <Field label="Years of Experience">
                                <select
                                    value={form.years_experience}
                                    onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none text-sm font-medium bg-white"
                                >
                                    {YEARS_OPTIONS.map((y) => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label={`Primary Skills (Add up to 10)`}>
                                <div className="flex gap-2">
                                    <input
                                        ref={skillRef}
                                        type="text"
                                        value={skillInput}
                                        onChange={(e) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ',') {
                                                e.preventDefault()
                                                addSkill()
                                            }
                                        }}
                                        placeholder="Type a skill and press Enter"
                                        className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none text-sm font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={addSkill}
                                        className="px-3 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 transition shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {form.primary_skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {form.primary_skills.map((s) => (
                                            <span key={s} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100">
                                                {s}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSkill(s)}
                                                    className="w-4 h-4 rounded-full hover:bg-indigo-200 inline-flex items-center justify-center"
                                                    aria-label={`Remove ${s}`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[10px] text-slate-400 mt-2">{form.primary_skills.length}/10 skills</p>
                            </Field>

                            <Field label="Additional Notes (Optional)">
                                <textarea
                                    value={form.additional_notes}
                                    onChange={(e) => setForm((f) => ({ ...f, additional_notes: e.target.value }))}
                                    placeholder="Anything else you'd like us to know?"
                                    maxLength={500}
                                    rows={3}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none text-sm font-medium resize-none"
                                />
                                <p className="text-[10px] text-slate-400 text-right mt-1">{form.additional_notes.length}/500</p>
                            </Field>
                        </div>
                    </div>

                    {/* Why start here */}
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-slate-900 mb-1">Why start here?</p>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    We'll build your profile first, then compare it with your organization's operational context to generate a personalized readiness roadmap.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition">
                    Cancel
                </Link>
                <button
                    type="button"
                    onClick={handleContinue}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] disabled:opacity-60 transition"
                >
                    {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : (
                        <>Save &amp; Continue <ArrowRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">{label}</label>
            {children}
        </div>
    )
}
