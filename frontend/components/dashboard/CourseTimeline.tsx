'use client'

import React from 'react'
import { CheckCircle2, Circle, PlayCircle } from 'lucide-react'

type RoadmapResource = { name?: string; url?: string }
type RoadmapStep = {
  step_number?: number
  title?: string
  description?: string
  estimated_time?: string
  resources?: RoadmapResource[]
}

export type RoadmapLike = {
  id: number
  career_path?: string
  steps?: RoadmapStep[]
  current_step?: number
  completion_percentage?: number
}

function stepLabel(step: RoadmapStep, idx: number) {
  const n = typeof step.step_number === 'number' ? step.step_number : idx + 1
  return `Step ${n}`
}

export default function CourseTimeline({
  roadmap,
  maxItems = 8,
  onJumpToRoadmap,
}: {
  roadmap: RoadmapLike
  /** Prevents overly tall timelines on dashboard */
  maxItems?: number
  /** Optional click handler for "View full roadmap" */
  onJumpToRoadmap?: () => void
}) {
  const steps = Array.isArray(roadmap.steps) ? roadmap.steps : []
  const currentIdx = Math.max(0, Number.isFinite(roadmap.current_step) ? Number(roadmap.current_step) : 0)
  const pct = Math.max(0, Math.min(100, Math.round(Number(roadmap.completion_percentage || 0))))

  if (steps.length === 0) return null

  const startIdx = Math.max(0, currentIdx - 1)
  const windowed = steps.slice(startIdx, startIdx + maxItems)

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Course timeline</p>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            {roadmap.career_path || 'Your roadmap'}
          </h3>
          <p className="text-sm text-slate-500">
            Continue step-by-step like an Educative course.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-bold">
            {pct}% complete
          </div>
          <button
            type="button"
            onClick={onJumpToRoadmap}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
          >
            View full
          </button>
        </div>
      </div>

      <div className="p-6">
        <ol className="relative pl-8">
          {/* vertical line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" aria-hidden />
          {windowed.map((s, i) => {
            const idx = startIdx + i
            const isDone = idx < currentIdx
            const isNow = idx === currentIdx
            return (
              <li key={idx} className="relative pb-6 last:pb-0">
                <div className="absolute left-[-2px] top-0">
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 bg-white rounded-full" />
                  ) : isNow ? (
                    <PlayCircle className="w-6 h-6 text-indigo-600 bg-white rounded-full" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 bg-white rounded-full" />
                  )}
                </div>
                <div
                  className={[
                    'rounded-2xl border p-4 transition-colors',
                    isNow
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : isDone
                        ? 'border-emerald-100 bg-emerald-50/30'
                        : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        {stepLabel(s, idx)}
                        {isNow ? ' • current' : isDone ? ' • completed' : ''}
                      </p>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {s.title || 'Untitled step'}
                      </h4>
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                      {s.estimated_time ? `⏳ ${s.estimated_time}` : null}
                    </div>
                  </div>
                  {s.description ? (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{s.description}</p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

