'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LibraryBig, BookOpen, ChevronRight, Clock, Filter } from 'lucide-react'
import { workflowsAPI } from '@/lib/api'
import type { Workflow } from '@/lib/demoData'

export default function WorkflowsListPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [filter, setFilter] = useState<string>('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    workflowsAPI.list().then((data) => {
      setWorkflows(data as Workflow[])
      setLoading(false)
    })
  }, [])

  const categories = ['All', ...Array.from(new Set(workflows.map((w) => w.category)))]
  const filtered = filter === 'All' ? workflows : workflows.filter((w) => w.category === filter)

  return (
    <div className="space-y-8 pb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <LibraryBig className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Workflow Library</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          How real analysts actually do the work
        </h1>
        <p className="text-slate-500 font-medium mt-2 max-w-2xl">
          Reference workflows for the operations you'll execute on shift. Each one explains the *why*, the steps, and the failure modes — written by analysts, not textbooks.
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
            <div key={i} className="h-48 bg-white rounded-3xl border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/workflows/${w.id}`}
              className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all p-6 sm:p-7 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
              <div className="flex items-start gap-3 mb-3 relative">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{w.category}</p>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{w.title}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">{w.summary}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {w.applies_to_roles.slice(0, 3).map((r) => (
                  <span key={r} className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    {r}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {w.estimated_read_minutes} min read
                </span>
                <span className="inline-flex items-center gap-1 text-indigo-600 font-bold group-hover:gap-2 transition-all">
                  Read
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
