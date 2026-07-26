'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Download,
    Sparkles,
    HelpCircle,
    Trophy,
} from 'lucide-react'
import StepProgressBar from '@/components/workforce/StepProgressBar'
import { getProfile, getDocuments, setCurrentStep, type ParticipantProfile, type OperationalDocument } from '@/lib/workforceState'
import { generateAnalysis, generateRoadmap, type AnalysisResult, type RoadmapOverview } from '@/lib/workforceMock'
import { workforceAPI } from '@/lib/api'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'

function mapBackendAnalysisForOutlook(a: any): Pick<AnalysisResult, 'overall_score' | 'readiness_label'> {
    return { overall_score: a.overall_score, readiness_label: a.readiness_label }
}

function mapBackendRoadmap(r: any): RoadmapOverview {
    return {
        recommended_skills: r.recommended_skills_count,
        learning_modules: r.learning_modules_count,
        key_projects: r.key_projects_count,
        days_to_complete: r.days_to_complete || '—',
        phases: (r.phases || []).map((p: any) => ({ number: p.number, label: p.label, duration: p.duration, items: p.items || [] })),
        top_priorities: r.top_priorities || [],
        next_steps: r.next_steps || [],
    }
}

const PHASE_COLORS = [
    { ring: 'bg-violet-600', text: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { ring: 'bg-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { ring: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { ring: 'bg-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
]

function OutlookGauge({ score, label }: { score: number; label: string }) {
    const radius = 56
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    return (
        <div className="relative w-36 h-36 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r={radius} stroke="#ede9fe" strokeWidth="12" fill="transparent" />
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="url(#grad)"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
                <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 tabular-nums">{score}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 mt-1 text-center">{label}</span>
            </div>
        </div>
    )
}

export default function RoadmapPathwayPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<ParticipantProfile | null>(null)
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
    const [roadmap, setRoadmap] = useState<RoadmapOverview | null>(null)

    useEffect(() => {
        setCurrentStep(5)
        if (MOCK_ONLY) {
            const p = getProfile()
            const d = getDocuments()
            const a = generateAnalysis(p, d)
            const r = generateRoadmap(a, p)
            setProfile(p)
            setAnalysis(a)
            setRoadmap(r)
            return
        }

        workforceAPI.getAnalysis()
            .then((a) => setAnalysis(mapBackendAnalysisForOutlook(a) as AnalysisResult))
            .catch(() => {
                toast.error('No analysis found. Please run the analysis again.')
                router.push('/workforce/analysis-comparison')
            })

        workforceAPI.getRoadmap()
            .then((r) => setRoadmap(mapBackendRoadmap(r)))
            .catch(async () => {
                try {
                    const r = await workforceAPI.generateRoadmap()
                    setRoadmap(mapBackendRoadmap(r))
                } catch (err: any) {
                    if (err?.response?.data?.detail === 'INSUFFICIENT_CREDITS') {
                        toast.error('Not enough credits to generate your roadmap.')
                    } else {
                        toast.error('Could not generate your roadmap. Please try again.')
                    }
                }
            })
    }, [])

    const handleDownload = () => {
        toast.success('Your roadmap is being prepared. We\'ll email you the PDF.')
    }

    const handleStart = () => {
        toast.success('Your journey starts now — heading to the dashboard.')
        router.push('/dashboard')
    }

    if (!analysis || !roadmap) {
        return (
            <div className="max-w-7xl mx-auto pb-10">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-slate-500 font-medium">Generating your roadmap…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 5 of 5: Your Personalized Roadmap
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Based on your goals and the gaps we identified, here's your recommended path to build readiness.
                </p>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <StepProgressBar currentStep={5} maxReachable={5} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
                {/* Main: Roadmap phases */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <p className="font-black text-slate-900 mb-5">Your Roadmap</p>

                        <div className="relative">
                            {/* Vertical connector line */}
                            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" aria-hidden />

                            <ol className="space-y-5">
                                {roadmap.phases.map((phase, idx) => {
                                    const c = PHASE_COLORS[idx % PHASE_COLORS.length]
                                    return (
                                        <li key={phase.number} className="relative grid grid-cols-[44px,140px,1fr] gap-4 items-start">
                                            <div className={`relative z-10 w-10 h-10 rounded-full ${c.ring} text-white font-black flex items-center justify-center shadow-md`}>
                                                {phase.number}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-black uppercase tracking-widest ${c.text} mb-0.5`}>Phase {phase.number}</p>
                                                <p className="text-sm font-black text-slate-900">{phase.label}</p>
                                                <p className="text-[11px] text-slate-500 font-medium">({phase.duration})</p>
                                            </div>
                                            <ul className="space-y-1.5">
                                                {phase.items.map((item) => (
                                                    <li key={item} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    )
                                })}
                            </ol>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Roadmap overview */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="font-black text-slate-900 mb-4">Roadmap Overview</p>
                            <div className="grid grid-cols-2 gap-3">
                                <Stat number={roadmap.recommended_skills} label="Recommended Skills" />
                                <Stat number={roadmap.learning_modules} label="Learning Modules" />
                                <Stat number={roadmap.key_projects} label="Key Projects" />
                                <Stat number={roadmap.days_to_complete} label="Days to Complete" />
                            </div>
                        </div>

                        {/* Next Steps */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="font-black text-slate-900 mb-4">Next Steps</p>
                            <ul className="space-y-2.5">
                                {roadmap.next_steps.map((step) => (
                                    <li key={step} className="flex items-start gap-2 text-sm text-slate-700 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right rail */}
                <div className="space-y-4">
                    <div className="rounded-2xl bg-white border border-violet-100 shadow-sm p-5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Readiness Outlook</p>
                        <OutlookGauge score={analysis.overall_score} label={analysis.readiness_label} />
                        <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed">
                            With focused learning and practice, you'll be ready to take on more advanced responsibilities.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-3">Top Priorities</p>
                        <ol className="space-y-2">
                            {roadmap.top_priorities.map((p, i) => (
                                <li key={p} className="flex items-start gap-2 text-xs font-bold text-slate-800">
                                    <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] shrink-0">
                                        {i + 1}
                                    </span>
                                    <span>{p}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-5 shadow-xl shadow-violet-200">
                        <div className="flex items-center gap-2 mb-2">
                            <HelpCircle className="w-4 h-4 text-violet-200" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-200">Need Help?</p>
                        </div>
                        <p className="text-xs text-violet-100 leading-relaxed mb-3">
                            Our AI mentor is here to guide you through your learning journey.
                        </p>
                        <Link
                            href="/mentor"
                            className="block w-full text-center px-4 py-2.5 rounded-xl bg-white text-violet-700 font-black text-xs shadow-md hover:scale-[1.02] transition"
                        >
                            Chat with Mentor
                        </Link>
                    </div>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 flex-wrap gap-3">
                <Link
                    href="/workforce/results-insights"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition"
                    >
                        <Download className="w-4 h-4" />
                        Download Roadmap (PDF)
                    </button>
                    <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition">
                        Save &amp; Exit
                    </Link>
                    <button
                        type="button"
                        onClick={handleStart}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] transition"
                    >
                        <Trophy className="w-4 h-4" />
                        Start Your Journey
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function Stat({ number, label }: { number: number | string; label: string }) {
    return (
        <div className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-center">
            <p className="text-2xl font-black text-violet-700 tabular-nums leading-tight">{number}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1 leading-tight">{label}</p>
        </div>
    )
}
