'use client'

import { useState, useEffect } from 'react'
import { Briefcase, CheckCircle, Circle, AlertCircle, FileText, Code, Award, ArrowRight, Sparkles, Gauge, Target } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { dashboardAPI, aiFeaturesAPI, readinessAPI } from '@/lib/api'
import { getDemoStatsWithSelections } from '@/lib/demoData'
import ChatMessageBubble from '@/components/ui/ChatMessageBubble'
import type { ReadinessLevel } from '@/lib/demoData'

const DEMO_CAREER_KEY = 'trainpi_career_path'
const DEMO_GOAL_KEY = 'trainpi_weekly_goal'

function getInitialStats() {
    if (typeof window === 'undefined') return getDemoStatsWithSelections(null, 3)
    const career = localStorage.getItem(DEMO_CAREER_KEY)
    const goalRaw = localStorage.getItem(DEMO_GOAL_KEY)
    return getDemoStatsWithSelections(career, goalRaw ? Number(goalRaw) : 3)
}

export default function JobReadinessPage() {
    const [stats, setStats] = useState<any>(getInitialStats)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [loadingFeedback, setLoadingFeedback] = useState(false)
    const [readinessScore, setReadinessScore] = useState<number | null>(null)
    const [readinessLevel, setReadinessLevel] = useState<ReadinessLevel | null>(null)

    useEffect(() => {
        dashboardAPI.getStats().then(setStats).catch(() => {})
        readinessAPI.getReport().then((r) => {
            setReadinessScore(r.overall_score)
            setReadinessLevel(r.overall_level)
        }).catch(() => {})
    }, [])

    const handleGetAIFeedback = async () => {
        setLoadingFeedback(true)
        setFeedback(null)
        try {
            const res = await aiFeaturesAPI.jobReadinessFeedback({
                career_path: stats?.career_path ?? undefined,
                roadmap_completion: stats?.roadmap_completion,
                resume_score: stats?.resume_score ?? undefined,
                lessons_completed: stats?.courses_completed ?? stats?.lessons_completed ?? 0,
            })
            setFeedback(res.feedback)
        } catch (e: any) {
            toast.error(e.response?.data?.detail || e.message || 'Failed to get feedback')
        } finally {
            setLoadingFeedback(false)
        }
    }

    const criteria = [
        {
            id: 1,
            label: 'Operational Career Path Selected',
            met: !!stats?.career_path,
            icon: Briefcase,
            action: '/career',
            actionText: 'Choose path',
        },
        {
            id: 2,
            label: 'Roadmap Progress > 60%',
            met: (stats?.roadmap_completion || 0) > 60,
            progress: stats?.roadmap_completion || 0,
            icon: Award,
            action: '/roadmap',
            actionText: 'Continue roadmap',
        },
        {
            id: 3,
            label: 'Resume Operationally Optimized',
            met: (stats?.resume_score ?? 0) >= 70,
            icon: FileText,
            action: '/profile',
            actionText: 'Analyze resume',
        },
        {
            id: 4,
            label: 'Run 3 Scenarios',
            met: (stats?.courses_completed ?? 0) >= 3,
            icon: Target,
            action: '/scenarios',
            actionText: 'Run a scenario',
        },
    ]

    const allMet = criteria.every((c) => c.met)
    const score = Math.round((criteria.filter((c) => c.met).length / criteria.length) * 100)

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Job Readiness</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Are you operationally ready?</h1>
                    <p className="text-slate-500 font-medium mt-2 max-w-2xl">
                        Four operational checkpoints between you and an applied-for-the-job decision.
                    </p>
                </div>
                <button
                    onClick={handleGetAIFeedback}
                    disabled={loadingFeedback}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                    <Sparkles size={16} />
                    {loadingFeedback ? 'Generating feedback…' : 'Get AI mentor feedback'}
                </button>
            </div>

            {/* Top metric row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex items-center gap-5">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${allMet ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {allMet ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Checklist Score</p>
                        <p className="text-3xl font-black text-slate-900">{score}<span className="text-base font-bold text-slate-400">%</span></p>
                        <p className="text-xs font-bold text-slate-500 mt-1">{allMet ? 'All checkpoints met — apply with confidence.' : `${criteria.filter((c) => c.met).length} of ${criteria.length} checkpoints met.`}</p>
                    </div>
                </div>
                {readinessScore !== null && (
                    <Link
                        href="/dashboard/readiness"
                        className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl shadow-xl shadow-indigo-200 p-6 flex items-center gap-5 group hover:scale-[1.01] transition"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                            <Gauge size={32} />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-100 mb-1">Operational Readiness</p>
                            <p className="text-3xl font-black tabular-nums">{readinessScore}<span className="text-base font-bold text-violet-200">/100</span></p>
                            <p className="text-xs font-bold text-violet-100 mt-1">{readinessLevel} — full breakdown →</p>
                        </div>
                        <ArrowRight className="text-white/70 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* AI Feedback */}
            {feedback && (
                <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/30 p-2 sm:p-3">
                    <div className="bg-gradient-to-br from-violet-50 to-white rounded-3xl p-4 sm:p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-violet-600" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">AI Mentor Feedback</p>
                        </div>
                        <ChatMessageBubble role="assistant" content={feedback} showIcon={false} />
                    </div>
                </div>
            )}

            {/* Checkpoint cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criteria.map((item) => (
                    <div
                        key={item.id}
                        className={`p-6 rounded-3xl border-2 transition-all ${
                            item.met
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    item.met ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                                <item.icon size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-black text-slate-900 text-base">{item.label}</h3>
                                    {item.met ? (
                                        <CheckCircle className="text-emerald-600" size={20} />
                                    ) : (
                                        <Circle className="text-slate-300" size={20} />
                                    )}
                                </div>

                                {item.progress !== undefined && !item.met && (
                                    <div className="w-full bg-slate-100 rounded-full h-2 my-3 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all"
                                            style={{ width: `${item.progress}%` }}
                                        ></div>
                                    </div>
                                )}

                                {!item.met && (
                                    <Link href={item.action} className="text-indigo-600 font-bold text-xs inline-flex items-center gap-1 mt-2 hover:gap-2 transition-all">
                                        {item.actionText}
                                        <ArrowRight size={12} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
