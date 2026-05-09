'use client'

import { useState, useEffect } from 'react'
import { Briefcase, CheckCircle, Circle, AlertCircle, FileText, Code, Award, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { dashboardAPI, aiFeaturesAPI } from '@/lib/api'
import { getDemoStatsWithSelections } from '@/lib/demoData'

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

    useEffect(() => {
        dashboardAPI.getStats().then(setStats).catch(() => {})
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
            const msg = e.response?.data?.detail || e.message || 'Failed to get feedback'
            toast.error(msg)
            if (msg.includes('credits') || msg.includes('quota')) {
                toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' })
            }
        } finally {
            setLoadingFeedback(false)
        }
    }

    const criteria = [
        {
            id: 1,
            label: 'Career Path Selected',
            met: !!stats?.career_path,
            icon: Briefcase,
            action: '/dashboard',
            actionText: 'Select Path'
        },
        {
            id: 2,
            label: 'Roadmap > 80% Complete',
            met: (stats?.roadmap_completion || 0) > 80,
            progress: stats?.roadmap_completion || 0,
            icon: Award,
            action: '/courses',
            actionText: 'Continue Learning'
        },
        {
            id: 3,
            label: 'Resume Optimized',
            met: (stats?.resume_score ?? 0) >= 70,
            icon: FileText,
            action: '/profile',
            actionText: 'View Profile'
        },
        {
            id: 4,
            label: '3 Projects Completed',
            met: (stats?.lessons_completed ?? 0) >= 3,
            icon: Code,
            action: '/learn',
            actionText: 'View Lessons'
        }
    ]

    const allMet = criteria.every(c => c.met)
    const score = (criteria.filter(c => c.met).length / criteria.length) * 100

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                            Job Readiness Check
                        </span>
                        <span className="text-3xl">🚀</span>
                    </h1>
                    <p className="text-gray-600 text-lg">Are you ready to land your dream job? Let&apos;s verify.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-6">
                    <div className="text-center px-4">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Readiness Score</p>
                        <p className={`text-4xl font-black ${score === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{score}%</p>
                    </div>
                    <button
                        onClick={handleGetAIFeedback}
                        disabled={loadingFeedback}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-60"
                    >
                        <Sparkles size={18} /> {loadingFeedback ? 'Getting feedback...' : 'Get AI feedback'}
                    </button>
                </div>
            </div>
            {feedback && (
                <div className="p-6 rounded-2xl border border-emerald-100 bg-emerald-50/50">
                    <h3 className="font-bold text-emerald-800 mb-2">AI feedback</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{feedback}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="card-premium p-8 flex flex-col items-center justify-center text-center bg-gradient-to-br from-white to-emerald-50/50">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${allMet ? 'bg-emerald-500 text-white' : 'bg-white border-4 border-amber-200 text-amber-500'}`}>
                        {allMet ? <CheckCircle size={64} /> : <AlertCircle size={64} />}
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {allMet ? 'You are Job Ready!' : 'Not Quite Ready Yet'}
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto mb-8">
                        {allMet
                            ? "Congratulations! You've met all the criteria to start applying for roles in your field."
                            : "Keep going! You're making great progress. Focus on the items below to reach job readiness."
                        }
                    </p>
                    {allMet ? (
                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-sm font-medium">
                            🎉 Job board integration will be added soon. Stay tuned!
                        </div>
                    ) : (
                        <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-sm">
                            Complete the missing steps to unlock certification.
                        </div>
                    )}
                </div>

                {/* Checklist */}
                <div className="space-y-4">
                    {criteria.map((item) => (
                        <div key={item.id} className={`p-6 rounded-2xl border transition-all ${item.met ? 'bg-white border-emerald-100' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${item.met ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-bold text-lg ${item.met ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {item.label}
                                        </h3>
                                        {item.met ? (
                                            <CheckCircle className="text-emerald-500" size={24} />
                                        ) : (
                                            <Circle className="text-slate-300" size={24} />
                                        )}
                                    </div>

                                    {item.progress !== undefined && !item.met && (
                                        <div className="w-full bg-gray-100 rounded-full h-2 my-2">
                                            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${item.progress}%` }}></div>
                                        </div>
                                    )}

                                    {!item.met && (
                                        <Link href={item.action} className="text-indigo-600 font-medium text-sm flex items-center gap-1 mt-2 hover:underline">
                                            {item.actionText} <ArrowRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
