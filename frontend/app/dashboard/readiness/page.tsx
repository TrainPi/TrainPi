'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Gauge,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Target,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { readinessAPI } from '@/lib/api'
import type { ReadinessLevel, ReadinessDimension } from '@/lib/demoData'
import toast from 'react-hot-toast'

type Report = {
  overall_score: number
  overall_level: ReadinessLevel
  target_role: string
  last_updated: string
  summary: string
  dimensions: ReadinessDimension[]
  priority_gap: string
  recommended_next_steps: string[]
}

const LEVEL_COPY: Record<ReadinessLevel, { color: string; bg: string; ring: string; label: string; desc: string }> = {
  Beginner: {
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    ring: 'ring-rose-200',
    label: 'Beginner',
    desc: 'Foundational knowledge — not yet ready for shift work.',
  },
  Developing: {
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    ring: 'ring-amber-200',
    label: 'Developing',
    desc: 'Operational thinking present — workflow execution needs practice.',
  },
  Operational: {
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    label: 'Operational',
    desc: 'Workforce-ready for the target role with consistent execution.',
  },
}

function levelFromScore(score: number): ReadinessLevel {
  if (score >= 75) return 'Operational'
  if (score >= 45) return 'Developing'
  return 'Beginner'
}

function GaugeRing({ score, level }: { score: number; level: ReadinessLevel }) {
  const radius = 84
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const copy = LEVEL_COPY[level]

  const stroke =
    level === 'Operational' ? '#10b981' : level === 'Developing' ? '#f59e0b' : '#f43f5e'

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
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
        <span className="text-5xl font-black text-slate-900">{score}</span>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mt-1">Score / 100</span>
        <span className={`mt-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${copy.bg} ${copy.color}`}>
          {copy.label}
        </span>
      </div>
    </div>
  )
}

function DimensionCard({ d }: { d: ReadinessDimension }) {
  const copy = LEVEL_COPY[d.level]
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-black text-slate-900 text-lg leading-tight">{d.label}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md">{d.description}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${copy.bg} ${copy.color} shrink-0`}>
          {copy.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              d.level === 'Operational' ? 'bg-emerald-500' : d.level === 'Developing' ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${d.score}%` }}
          />
        </div>
        <span className="text-sm font-black text-slate-700 tabular-nums w-10 text-right">{d.score}</span>
      </div>

      <div className="space-y-1.5 mb-4">
        {d.evidence.map((e, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
            <span className="text-slate-300 mt-0.5">▸</span>
            <span>{e}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-start gap-2">
        <Target className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
        <p className="text-xs font-semibold text-slate-700 leading-relaxed">{d.next_action}</p>
      </div>
    </div>
  )
}

export default function ReadinessPage() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    readinessAPI.getReport().then((r) => {
      setReport(r as Report)
      setLoading(false)
    })
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const fresh = await readinessAPI.refresh()
      setReport(fresh as Report)
      toast.success('Readiness score refreshed')
    } catch {
      toast.error('Could not refresh score')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading || !report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-72 bg-slate-200 rounded-xl" />
        <div className="h-72 bg-white rounded-3xl border border-slate-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  const top3Gaps = [...report.dimensions].sort((a, b) => a.score - b.score).slice(0, 3)

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Operational Readiness</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How ready are you for a <span className="text-indigo-600">{report.target_role}</span> role?
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-sm sm:text-base">
            Updated {new Date(report.last_updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md text-sm font-bold text-slate-700 disabled:opacity-50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recalculating…' : 'Refresh score'}
        </button>
      </div>

      {/* Hero Card */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/30 p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />

        <div className="relative grid md:grid-cols-[auto,1fr] gap-8 items-center">
          <GaugeRing score={report.overall_score} level={report.overall_level} />

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Summary</p>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
                {report.summary}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Priority Gap</p>
                  <p className="text-sm text-amber-900 font-semibold leading-snug">{report.priority_gap}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/scenarios"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition text-sm"
              >
                <Target className="w-4 h-4" />
                Run a scenario
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/workflows"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Browse workflows
              </Link>
              <Link
                href="/mentor"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Ask the mentor
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Gaps */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Your three highest-impact gaps</h2>
            <p className="text-sm text-slate-500">Close these first — they block the most operational workflows.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3Gaps.map((d, i) => (
            <div
              key={d.key}
              className="bg-gradient-to-br from-white to-rose-50/40 rounded-2xl border-2 border-rose-100 p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Gap #{i + 1}</span>
                <span className="text-2xl font-black text-rose-600 tabular-nums">{d.score}</span>
              </div>
              <h3 className="font-black text-slate-900 mb-2">{d.label}</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">{d.next_action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* All Dimensions */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Full readiness breakdown</h2>
            <p className="text-sm text-slate-500">Per-skill assessment across the six operational dimensions.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.dimensions.map((d) => (
            <DimensionCard key={d.key} d={d} />
          ))}
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Recommended next steps</h2>
        </div>
        <ol className="space-y-3">
          {report.recommended_next_steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Level Legend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {(['Beginner', 'Developing', 'Operational'] as ReadinessLevel[]).map((lvl) => {
          const c = LEVEL_COPY[lvl]
          return (
            <div key={lvl} className={`rounded-2xl border ${c.ring} ${c.bg} p-4`}>
              <p className={`font-black uppercase tracking-widest ${c.color}`}>{c.label}</p>
              <p className="text-slate-600 mt-1 leading-snug">{c.desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
