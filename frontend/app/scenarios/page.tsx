'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Target, Clock, ChevronRight, Shield, KeyRound, ListChecks, AlertTriangle, FileSearch, Filter } from 'lucide-react'
import { scenariosAPI } from '@/lib/api'
import type { Scenario } from '@/lib/demoData'

const CATEGORY_ICONS: Record<string, any> = {
  'Phishing': Shield,
  'MFA / IAM': KeyRound,
  'Ticket Triage': ListChecks,
  'Incident Response': AlertTriangle,
  'Log Analysis': FileSearch,
}

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  Advanced: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function ScenariosListPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [filter, setFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    scenariosAPI.list().then((data) => {
      setScenarios(data as Scenario[])
      setLoading(false)
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(scenarios.map((s) => s.category)))]
  const filtered = filter === 'All' ? scenarios : scenarios.filter((s) => s.category === filter)

  return (
    <div className="space-y-8 pb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Scenarios</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Practice the decisions analysts make on shift
        </h1>
        <p className="text-slate-500 font-medium mt-2 max-w-2xl">
          Each scenario walks you through a real operational situation — alert, investigation, containment, ticket. Choose the right action; the mentor explains why.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400 mr-1" />
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === c
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((s) => {
            const Icon = CATEGORY_ICONS[s.category] || Target
            return (
              <Link
                key={s.id}
                href={`/scenarios/${s.id}`}
                className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all p-6 sm:p-7 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />

                <div className="flex items-start justify-between mb-5 relative">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${DIFFICULTY_COLOR[s.difficulty]}`}>
                    {s.difficulty}
                  </span>
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{s.category}</p>
                <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4">{s.summary}</p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {s.duration_minutes} min
                    </span>
                    <span>·</span>
                    <span>{s.steps.length} decisions</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-indigo-600 font-bold group-hover:gap-2 transition-all">
                    Start
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="md:col-span-2 p-12 rounded-3xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-slate-400 font-bold">No scenarios in this category yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
