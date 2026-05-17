'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Clock, Target, AlertCircle, Sparkles, ChevronRight } from 'lucide-react'
import { workflowsAPI } from '@/lib/api'
import type { Workflow } from '@/lib/demoData'

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} className="font-black text-slate-900">{p.slice(2, -2)}</strong>
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[0.9em] font-mono">{p.slice(1, -1)}</code>
    }
    return <span key={i}>{p}</span>
  })
}

export default function WorkflowDetailPage() {
  const params = useParams<{ id: string }>()
  const [workflow, setWorkflow] = useState<Workflow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params?.id) return
    workflowsAPI.get(params.id).then((data) => {
      setWorkflow(data as Workflow | null)
      setLoading(false)
    })
  }, [params?.id])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-96 bg-white rounded-3xl border border-slate-100" />
      </div>
    )
  }

  if (!workflow) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Workflow not found</h1>
        <p className="text-slate-500 mb-6">It may have been removed or is still being built.</p>
        <Link href="/workflows" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold">
          <ArrowLeft className="w-4 h-4" />
          Back to library
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <Link href="/workflows" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to workflow library
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 p-8 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{workflow.category} workflow</p>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">{workflow.title}</h1>
            </div>
          </div>

          <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-6">{workflow.summary}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-700 font-bold border border-slate-100">
              <Clock className="w-3.5 h-3.5" />
              {workflow.estimated_read_minutes} min read
            </span>
            {workflow.applies_to_roles.map((r) => (
              <span key={r} className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Why it matters */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">Why this matters operationally</p>
            <p className="text-sm sm:text-base text-amber-900 font-semibold leading-relaxed">{workflow.why_it_matters}</p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {workflow.sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                {idx + 1}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{section.heading}</h2>
            </div>
            <ul className="space-y-2.5">
              {section.body.map((line, i) => (
                <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 leading-relaxed">
                  <span className="text-indigo-500 mt-1 shrink-0">▸</span>
                  <span>{renderInline(line)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Practice CTA */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Practice what you read</p>
            <h3 className="text-2xl font-black mb-2">Now run the matching scenario.</h3>
            <p className="text-indigo-100 max-w-xl">
              Reading a workflow teaches you the steps. Running a scenario teaches you the decisions. Try one now while this is fresh.
            </p>
          </div>
          {workflow.related_scenarios.length > 0 ? (
            <Link
              href={`/scenarios/${workflow.related_scenarios[0]}`}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-indigo-600 font-black shadow-lg hover:scale-105 transition text-sm shrink-0"
            >
              <Target className="w-4 h-4" />
              Run scenario
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/scenarios"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-indigo-600 font-black shadow-lg hover:scale-105 transition text-sm shrink-0"
            >
              <Target className="w-4 h-4" />
              Browse scenarios
            </Link>
          )}
        </div>
      </div>

      {/* Mentor link */}
      <Link
        href="/mentor"
        className="block bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all p-6 group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-black text-slate-900">Have a question about this workflow?</p>
              <p className="text-sm text-slate-500">Ask the Operational Readiness Mentor — get role-specific answers.</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>
      </Link>
    </div>
  )
}
