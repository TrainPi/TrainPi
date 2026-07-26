'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Sparkles,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Download,
    Lightbulb,
} from 'lucide-react'
import StepProgressBar from '@/components/workforce/StepProgressBar'
import { getProfile, getDocuments, setCurrentStep, type ParticipantProfile, type OperationalDocument } from '@/lib/workforceState'
import { generateAnalysis, type AnalysisResult } from '@/lib/workforceMock'
import { workforceAPI, downloadBlob } from '@/lib/api'
import { MOCK_ONLY } from '@/lib/mockConfig'
import toast from 'react-hot-toast'

function mapBackendAnalysis(a: any): AnalysisResult {
    return {
        overall_score: a.overall_score,
        readiness_label: a.readiness_label,
        summary: a.summary,
        top_strengths: a.top_strengths || [],
        top_gaps: a.top_gaps || [],
        key_insights: a.key_insights || [],
        capability_alignment: [
            { label: 'Technical Skills', pct: a.technical_skills_score, color: 'indigo' },
            { label: 'Experience Alignment', pct: a.experience_alignment_score, color: 'blue' },
            { label: 'Workflow Readiness', pct: a.workflow_readiness_score, color: 'amber' },
            { label: 'Mission Alignment', pct: a.mission_alignment_score, color: 'violet' },
            { label: 'Overall Alignment', pct: a.overall_score, color: 'emerald' },
        ],
        gap_summary: a.gap_summary || { major: 0, moderate: 0, minor: 0 },
        comparison_table: (a.comparison_table || []).map((row: any) => ({
            area: row.area,
            participant: row.participant,
            agency_requirement: row.agency_requirement,
            result: row.result,
        })),
    }
}

function ReadinessGauge({ score, label }: { score: number; label: string }) {
    const radius = 70
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (score / 100) * circumference
    const stroke =
        score >= 85 ? '#10b981' :
        score >= 70 ? '#6366f1' :
        score >= 50 ? '#f59e0b' :
        '#f43f5e'

    return (
        <div className="relative w-44 h-44 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r={radius} stroke="#f1f5f9" strokeWidth="14" fill="transparent" />
                <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    stroke={stroke}
                    strokeWidth="14"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900 tabular-nums">{score}%</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 mt-1">{label}</span>
            </div>
        </div>
    )
}

const COLOR_BAR: Record<string, string> = {
    indigo: 'bg-indigo-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
}

export default function ResultsInsightsPage() {
    const router = useRouter()
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
    const [profile, setProfile] = useState<ParticipantProfile | null>(null)

    useEffect(() => {
        setCurrentStep(4)
        if (MOCK_ONLY) {
            const p = getProfile()
            const d = getDocuments()
            setProfile(p)
            setAnalysis(generateAnalysis(p, d))
            return
        }
        workforceAPI.getProfile().then((p) => {
            setProfile({
                current_job_title: p.current_job_title || '',
                years_experience: p.years_experience || '',
                primary_skills: p.primary_skills || [],
                additional_notes: p.additional_notes || '',
                resume_filename: p.resume_filename || null,
                resume_size_kb: null,
                uploaded_at: null,
            })
        }).catch(() => {})
        workforceAPI.getAnalysis()
            .then((a) => setAnalysis(mapBackendAnalysis(a)))
            .catch(() => {
                toast.error('No analysis found. Please run the analysis again.')
                router.push('/workforce/analysis-comparison')
            })
    }, [])

    const handleContinue = () => {
        setCurrentStep(5)
        router.push('/workforce/roadmap-pathway')
    }

    const [downloading, setDownloading] = useState(false)

    const handleDownload = async () => {
        if (MOCK_ONLY) {
            toast.success('Summary report is being prepared. We\'ll email it shortly.')
            return
        }
        setDownloading(true)
        try {
            const blob = await workforceAPI.downloadAnalysisReport()
            downloadBlob(blob, 'trainpi-readiness-report.pdf')
            toast.success('Report downloaded')
        } catch {
            toast.error('Could not generate report. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    if (!analysis) {
        return (
            <div className="max-w-7xl mx-auto pb-10">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                    <Sparkles className="w-8 h-8 text-violet-600 mx-auto mb-3 animate-pulse" />
                    <p className="text-slate-500 font-medium">Loading your results…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Step 4 of 5: Results &amp; Insights
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                    Here's what we found based on the analysis of your profile and organizational context.
                </p>
            </div>

            {/* Progress bar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                <StepProgressBar currentStep={4} maxReachable={4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,280px] gap-6">
                {/* Main column */}
                <div className="space-y-6">
                    {/* Top three cards: gauge, strengths, gaps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Overall Readiness Score</p>
                            <ReadinessGauge score={analysis.overall_score} label={analysis.readiness_label} />
                            <p className="text-xs text-slate-600 mt-3 font-medium leading-relaxed">{analysis.summary}</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Top Strengths</p>
                            <ul className="space-y-2.5">
                                {analysis.top_strengths.map((s) => (
                                    <li key={s} className="flex items-start gap-2 text-sm font-bold text-slate-800">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-3">Top Gaps</p>
                            <ul className="space-y-2.5">
                                {analysis.top_gaps.map((g, i) => (
                                    <li key={g} className="flex items-start gap-2 text-sm font-bold text-slate-800">
                                        {i < 2 ? (
                                            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        )}
                                        <span>{g}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Capability alignment + gap summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="font-black text-slate-900 mb-4">Capability Alignment</p>
                            <ul className="space-y-3">
                                {analysis.capability_alignment.map((row) => (
                                    <li key={row.label}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-bold text-slate-700">{row.label}</span>
                                            <span className="text-xs font-black text-slate-900 tabular-nums">{row.pct}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${COLOR_BAR[row.color] || 'bg-violet-500'} rounded-full transition-all duration-700`}
                                                style={{ width: `${row.pct}%` }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <p className="font-black text-slate-900 mb-4">Gap Summary</p>
                            <ul className="space-y-3">
                                <GapRow color="rose" count={analysis.gap_summary.major} label="Major Gaps" detail="Require immediate attention" />
                                <GapRow color="amber" count={analysis.gap_summary.moderate} label="Moderate Gaps" detail="Should be addressed" />
                                <GapRow color="emerald" count={analysis.gap_summary.minor} label="Minor Gaps" detail="Nice to have improvements" />
                            </ul>
                        </div>
                    </div>

                    {/* Comparison table */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <p className="font-black text-slate-900">Detailed Comparison</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Participant vs Agency Requirement</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Area</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Participant</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2 pr-3">Agency Requirement</th>
                                        <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 py-2">Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {analysis.comparison_table.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition">
                                            <td className="py-2.5 pr-3 font-bold text-slate-900">{row.area}</td>
                                            <td className="py-2.5 pr-3 text-slate-700">{row.participant}</td>
                                            <td className="py-2.5 pr-3 text-slate-700">{row.agency_requirement}</td>
                                            <td className="py-2.5">
                                                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                                    row.result === 'Match' || row.result === 'Strength'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : row.result === 'Moderate gap'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {row.result}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right rail */}
                <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-black text-slate-900 mb-1">What This Means</p>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                    Your analysis compares your skills, experience, and background with your organization's operational requirements to identify strengths, gaps, and opportunities for growth.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">Key Insights</p>
                        <ul className="space-y-2 text-xs text-emerald-900 font-medium">
                            {analysis.key_insights.map((k) => (
                                <li key={k} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{k}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-700 mb-2">Pro Tip</p>
                        <p className="text-xs text-violet-900 leading-relaxed">
                            Use these insights to prioritize your learning and build a roadmap that closes your most important gaps first.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Next Step</p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                            Build your personalized roadmap in the next step to see recommended skills, learning resources, and milestones.
                        </p>
                    </div>
                </div>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200 flex-wrap gap-3">
                <Link
                    href="/workforce/analysis-comparison"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm transition disabled:opacity-60"
                    >
                        <Download className="w-4 h-4" />
                        {downloading ? 'Generating…' : 'Download Summary Report'}
                    </button>
                    <Link href="/dashboard" className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-sm transition">
                        Save &amp; Exit
                    </Link>
                    <button
                        type="button"
                        onClick={handleContinue}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:scale-[1.02] transition"
                    >
                        Continue to Roadmap
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function GapRow({ color, count, label, detail }: { color: 'rose' | 'amber' | 'emerald'; count: number; label: string; detail: string }) {
    const bg = color === 'rose' ? 'bg-rose-50' : color === 'amber' ? 'bg-amber-50' : 'bg-emerald-50'
    const border = color === 'rose' ? 'border-rose-200' : color === 'amber' ? 'border-amber-200' : 'border-emerald-200'
    const text = color === 'rose' ? 'text-rose-600' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
    return (
        <li className={`flex items-center gap-3 p-3 rounded-xl ${bg} border ${border}`}>
            <div className={`w-10 h-10 rounded-xl bg-white ${text} flex items-center justify-center font-black shrink-0 shadow-sm`}>
                {count}
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-black ${text}`}>{label}</p>
                <p className="text-[11px] text-slate-600">{detail}</p>
            </div>
        </li>
    )
}
