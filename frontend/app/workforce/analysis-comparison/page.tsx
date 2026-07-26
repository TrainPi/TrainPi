'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    User,
    FileText,
    Cpu,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Lightbulb,
    Target,
    GitCompareArrows,
    Layers,
    Brain,
    LineChart,
    Workflow,
    UserCheck,
} from 'lucide-react'
import StepProgressBar from '@/components/workforce/StepProgressBar'
import {
    getProfile,
    getDocuments,
    setCurrentStep,
    CATEGORY_LABELS,
    type ParticipantProfile,
    type OperationalDocument,
} from '@/lib/workforceState'
import {
    buildExtractedProfile,
    buildExtractedOrgContext,
    type ExtractedProfile,
    type ExtractedOrgContext,
} from '@/lib/workforceMock'
import { workforceAPI } from '@/lib/api'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'

const ANALYZING_TILES = [
    { icon: UserCheck, label: 'Skills Match', desc: 'Comparing your skills with role requirements' },
    { icon: LineChart, label: 'Experience Alignment', desc: 'Matching your experience to job expectations' },
    { icon: Layers, label: 'Gap Identification', desc: 'Finding capability and knowledge gaps' },
    { icon: Workflow, label: 'Workflow Readiness', desc: 'Assessing readiness for operational workflows' },
    { icon: Target, label: 'Mission Alignment', desc: 'Evaluating alignment with mission & objectives' },
    { icon: Sparkles, label: 'Development Priorities', desc: 'Identifying key areas for growth and reskill' },
]

export default function AnalysisComparisonPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<ParticipantProfile | null>(null)
    const [docs, setDocs] = useState<OperationalDocument[]>([])
    const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile | null>(null)
    const [extractedContext, setExtractedContext] = useState<ExtractedOrgContext | null>(null)
    const [progress, setProgress] = useState(0)
    const [analysisReady, setAnalysisReady] = useState(false)
    const [analysisError, setAnalysisError] = useState<string | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        setCurrentStep(3)

        if (MOCK_ONLY) {
            const p = getProfile()
            const d = getDocuments()
            setProfile(p)
            setDocs(d)
            setExtractedProfile(buildExtractedProfile(p))
            setExtractedContext(buildExtractedOrgContext(d))
        } else {
            // Kick off the real comparison engine in the background while the
            // progress animation plays; also fetch profile/docs for the display panels.
            Promise.all([workforceAPI.getProfile(), workforceAPI.listContextDocuments()])
                .then(([p, d]) => {
                    setProfile({
                        current_job_title: p.current_job_title || '',
                        years_experience: p.years_experience || '',
                        primary_skills: p.primary_skills || [],
                        additional_notes: p.additional_notes || '',
                        resume_filename: p.resume_filename || null,
                        resume_size_kb: null,
                        uploaded_at: null,
                    })
                    setExtractedProfile({
                        experience_signals: [],
                        skills_detected: p.extracted_skills?.length ? p.extracted_skills : (p.primary_skills || []),
                        certifications: p.extracted_certifications || [],
                        tools_detected: p.extracted_tools || [],
                        strengths: p.extracted_strengths || [],
                    })
                    const byCategory: Record<string, number> = { sop: 0, workflow: 0, role: 0, mission: 0, skill_framework: 0, other: 0 }
                    for (const doc of d) byCategory[doc.category] = (byCategory[doc.category] || 0) + 1
                    setDocs(d.map((doc: any) => ({ id: String(doc.id), name: doc.name, category: doc.category, size_kb: doc.size_kb, uploaded_at: doc.uploaded_at })))
                    setExtractedContext({
                        total_documents: d.length,
                        by_category: byCategory as any,
                        extracted_requirements: [],
                        extracted_workflows: [],
                        extracted_role_expectations: [],
                    })
                })
                .catch(() => { /* non-fatal — panels just show defaults */ })

            workforceAPI.runAnalysis()
                .then(() => setAnalysisReady(true))
                .catch((err: any) => {
                    const msg = err?.response?.data?.detail === 'INSUFFICIENT_CREDITS'
                        ? 'Not enough credits to run the analysis.'
                        : 'The AI analysis could not be completed. Please try again.'
                    setAnalysisError(msg)
                    toast.error(msg)
                })
        }

        // Animate progress 0 → 100 over ~7 seconds, slow at end so user can read
        intervalRef.current = setInterval(() => {
            setProgress((p) => {
                if (p >= 100) {
                    if (intervalRef.current) clearInterval(intervalRef.current)
                    return 100
                }
                // Variable step rate to feel realistic
                const step = p < 30 ? 4 : p < 60 ? 3 : p < 85 ? 2 : 1
                return Math.min(100, p + step)
            })
        }, 180)

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [])

    const readyToViewResults = MOCK_ONLY ? progress >= 100 : progress >= 100 && (analysisReady || !!analysisError)

    const handleViewResults = () => {
        if (analysisError) {
            router.push('/workforce/operational-context')
            return
        }
        setCurrentStep(4)
        router.push('/workforce/results-insights')
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 3 of 5: Analysis &amp; Comparison
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Our AI is comparing your profile with the operational requirements and building your readiness assessment.
                </p>
            </div>

            {/* Step progress */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <StepProgressBar currentStep={3} maxReachable={3} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
                {/* Main column */}
                <div className="space-y-6">
                    {/* AI in progress banner */}
                    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl shadow-xl shadow-violet-200 p-5 sm:p-6 text-white relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="relative flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-violet-200 mb-0.5">AI Analysis in Progress</p>
                                <p className="text-sm sm:text-base font-bold">
                                    Comparing your profile with uploaded operational documents…
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profile vs Context */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-6 items-stretch">
                            {/* LEFT — Your Profile */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Your Profile</p>
                                </div>
                                <ul className="space-y-2.5">
                                    <LineItem ok label="Resume & Experience" detail={profile?.resume_filename || 'Profile only'} />
                                    <LineItem ok label="Skills & Certifications" detail={extractedProfile?.skills_detected.length ? `${extractedProfile.skills_detected.length} skill${extractedProfile.skills_detected.length === 1 ? '' : 's'} detected` : 'None entered'} />
                                    <LineItem ok label="Years of Experience" detail={profile?.years_experience && profile.years_experience !== 'Select' ? profile.years_experience : 'Not provided'} />
                                </ul>

                                {extractedProfile && extractedProfile.skills_detected.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Detected skills</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {extractedProfile.skills_detected.slice(0, 8).map((s) => (
                                                <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">{s}</span>
                                            ))}
                                            {extractedProfile.skills_detected.length > 8 && (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">+{extractedProfile.skills_detected.length - 8}</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* CENTER — AI engine */}
                            <div className="hidden md:flex items-center">
                                <div className="flex flex-col items-center gap-3">
                                    <DashedConnector />
                                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-2xl shadow-violet-300">
                                        <Brain className="w-9 h-9 animate-pulse" />
                                        <div className="absolute inset-0 rounded-3xl ring-2 ring-violet-300/40 animate-ping" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center leading-tight">AI Analysis<br />Engine</p>
                                    <DashedConnector />
                                </div>
                            </div>

                            {/* RIGHT — Operational Context */}
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Operational Context</p>
                                </div>
                                <ul className="space-y-2.5">
                                    {(['sop', 'workflow', 'role', 'mission', 'skill_framework', 'other'] as const).map((cat) => {
                                        const count = extractedContext?.by_category[cat] ?? 0
                                        return (
                                            <LineItem
                                                key={cat}
                                                ok={count > 0}
                                                label={CATEGORY_LABELS[cat]}
                                                detail={count > 0 ? `${count} file${count === 1 ? '' : 's'}` : 'None uploaded'}
                                            />
                                        )
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Analysis progress bar */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="font-black text-slate-900">Analysis Progress</p>
                            <p className="text-2xl font-black text-violet-600 tabular-nums">{progress}%</p>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-3 font-medium">
                            {progress < 30 && 'Extracting skills, responsibilities, requirements, and workflows…'}
                            {progress >= 30 && progress < 60 && 'Mapping participant capabilities to operational requirements…'}
                            {progress >= 60 && progress < 90 && 'Identifying strengths, gaps, and readiness risks…'}
                            {progress >= 90 && progress < 100 && 'Generating personalized recommendations…'}
                            {progress >= 100 && !analysisError && (readyToViewResults ? 'Analysis complete — ready to view your readiness report.' : 'Finishing up your readiness report…')}
                            {progress >= 100 && analysisError && analysisError}
                        </p>
                    </div>

                    {/* Analyzing tiles */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">What We're Analyzing</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {ANALYZING_TILES.map((tile, i) => {
                                const Icon = tile.icon
                                const reached = progress > (i + 1) * (100 / ANALYZING_TILES.length) * 0.85
                                return (
                                    <div key={tile.label} className="text-center">
                                        <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-2 transition-all ${
                                            reached
                                                ? 'bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-600 shadow-sm'
                                                : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <p className="text-[11px] font-black text-slate-900 leading-tight mb-0.5">{tile.label}</p>
                                        <p className="text-[10px] text-slate-500 leading-snug">{tile.desc}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Right rail */}
                <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-slate-900 mb-1">Why Analysis Matters</p>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    Our AI compares your profile with real operational requirements to uncover gaps, strengths, and opportunities — ensuring sharp, mission-aligned recommendations.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">What You'll Get</p>
                        <ul className="space-y-2 text-xs text-emerald-900 font-medium">
                            {[
                                'Operational readiness assessment',
                                'Capability gap analysis',
                                'Role alignment insights',
                                'Personalized development pathway',
                                'Mission & strategic alignment',
                            ].map((x) => (
                                <li key={x} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    {x}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-2">Pro Tip</p>
                        <p className="text-xs text-violet-900 leading-relaxed">
                            The more complete your profile and operational documents, the more accurate and actionable your results will be.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Examples</p>
                        <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                            <li>· IT incident management SOP</li>
                            <li>· Onboarding workflow</li>
                            <li>· Help desk escalation process</li>
                            <li>· Role description for Cybersecurity Analyst</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 flex-wrap gap-3">
                <Link
                    href="/workforce/operational-context"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition">
                        Save &amp; Exit
                    </Link>
                    <button
                        type="button"
                        onClick={handleViewResults}
                        disabled={!readyToViewResults}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition"
                    >
                        {analysisError
                            ? 'Back to Operational Context'
                            : progress < 100
                                ? `View Results (${Math.ceil((100 - progress) / 14)} sec)`
                                : readyToViewResults ? 'View Results' : 'Finishing…'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function LineItem({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
    return (
        <li className="flex items-start justify-between gap-2 text-xs">
            <div className="flex items-start gap-2 flex-1 min-w-0">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${ok ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span className="font-bold text-slate-800">{label}</span>
            </div>
            <span className={`text-[10px] font-medium shrink-0 ${ok ? 'text-slate-500' : 'text-slate-400'}`}>{detail}</span>
        </li>
    )
}

function DashedConnector() {
    return (
        <svg width="2" height="40" viewBox="0 0 2 40" fill="none" className="text-slate-300">
            <line x1="1" y1="0" x2="1" y2="40" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
    )
}
