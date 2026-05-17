'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, Clock, ChevronRight, RotateCcw, Trophy, Target } from 'lucide-react'
import { scenariosAPI } from '@/lib/api'
import type { Scenario } from '@/lib/demoData'
import toast from 'react-hot-toast'

export default function ScenarioRunnerPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [loading, setLoading] = useState(true)
  const [stepIdx, setStepIdx] = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    if (!params?.id) return
    scenariosAPI.get(params.id).then((data) => {
      setScenario(data as Scenario | null)
      setLoading(false)
    })
  }, [params?.id])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        <div className="h-72 bg-white rounded-3xl border border-slate-100" />
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Scenario not found</h1>
        <p className="text-slate-500 mb-6">It may have been removed or is still being built.</p>
        <Link href="/scenarios" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold">
          <ArrowLeft className="w-4 h-4" />
          Back to scenarios
        </Link>
      </div>
    )
  }

  const step = scenario.steps[stepIdx]
  const isLast = stepIdx === scenario.steps.length - 1
  const choice = revealed && selectedChoice ? step.choices.find((c) => c.id === selectedChoice) : null

  const handleChoiceClick = (id: string) => {
    if (revealed) return
    setSelectedChoice(id)
    setRevealed(true)
    const picked = step.choices.find((c) => c.id === id)
    if (picked?.is_correct) {
      setCorrectCount((n) => n + 1)
      toast.success('Correct call.', { duration: 1500 })
    } else {
      toast.error('Not the strongest call. Read why →', { duration: 1500 })
    }
  }

  const handleNext = () => {
    if (isLast) {
      scenariosAPI.submitResult(scenario.id, correctCount, scenario.steps.length).catch(() => {})
      setCompleted(true)
      return
    }
    setStepIdx((i) => i + 1)
    setSelectedChoice(null)
    setRevealed(false)
  }

  const handleRestart = () => {
    setStepIdx(0)
    setSelectedChoice(null)
    setRevealed(false)
    setCorrectCount(0)
    setCompleted(false)
  }

  if (completed) {
    const pct = Math.round((correctCount / scenario.steps.length) * 100)
    const grade =
      pct >= 80 ? 'Operational' : pct >= 50 ? 'Developing' : 'Beginner'
    const gradeColor = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose'

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/scenarios" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          Back to scenarios
        </Link>

        <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative">
            <div className={`w-20 h-20 mx-auto rounded-3xl bg-${gradeColor}-50 text-${gradeColor}-600 flex items-center justify-center mb-6 shadow-lg`}>
              <Trophy className="w-10 h-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Scenario complete</p>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">
              {scenario.title}
            </h1>
            <p className="text-slate-500 font-medium mb-8">
              You answered <span className="font-black text-slate-900">{correctCount}</span> of <span className="font-black text-slate-900">{scenario.steps.length}</span> decisions correctly.
            </p>

            <div className="inline-flex flex-col items-center gap-2 mb-8">
              <span className="text-7xl font-black text-slate-900 tabular-nums">{pct}%</span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-${gradeColor}-50 text-${gradeColor}-700`}>
                {grade} on this workflow
              </span>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-indigo-300 hover:text-indigo-600 transition text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Run again
              </button>
              <Link
                href="/scenarios"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition text-sm"
              >
                <Target className="w-4 h-4" />
                Try another scenario
              </Link>
              <Link
                href="/dashboard/readiness"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:border-indigo-300 hover:text-indigo-600 transition text-sm"
              >
                <Sparkles className="w-4 h-4" />
                See readiness impact
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/scenarios" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to scenarios
      </Link>

      {/* Scenario header */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{scenario.category} · {scenario.role}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{scenario.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {scenario.duration_minutes} min</span>
            <span>·</span>
            <span>{scenario.difficulty}</span>
          </div>
        </div>
        <p className="text-slate-600 leading-relaxed">{scenario.summary}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 px-1">
        {scenario.steps.map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              i < stepIdx ? 'bg-emerald-500' : i === stepIdx ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          />
        ))}
        <span className="text-xs font-bold text-slate-500 ml-2 shrink-0">
          {stepIdx + 1} / {scenario.steps.length}
        </span>
      </div>

      {/* Step card */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-100/30 overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-br from-white to-indigo-50/40">
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">Step {step.step_number} · {step.title}</p>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">{step.narrative}</p>
        </div>

        <div className="p-6 sm:p-8 space-y-3">
          <p className="text-base font-black text-slate-900 mb-4">{step.question}</p>
          {step.choices.map((c) => {
            const isSelected = selectedChoice === c.id
            const showCorrect = revealed && c.is_correct
            const showWrong = revealed && isSelected && !c.is_correct
            return (
              <button
                key={c.id}
                onClick={() => handleChoiceClick(c.id)}
                disabled={revealed}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                  showCorrect
                    ? 'border-emerald-300 bg-emerald-50'
                    : showWrong
                    ? 'border-rose-300 bg-rose-50'
                    : isSelected
                    ? 'border-indigo-300 bg-indigo-50'
                    : revealed
                    ? 'border-slate-100 bg-slate-50 opacity-50'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                  showCorrect ? 'bg-emerald-600 text-white' :
                  showWrong ? 'bg-rose-600 text-white' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {showCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                   showWrong ? <XCircle className="w-4 h-4" /> :
                   c.id.toUpperCase()}
                </div>
                <span className={`text-sm font-medium leading-snug ${
                  showCorrect ? 'text-emerald-900' :
                  showWrong ? 'text-rose-900' :
                  'text-slate-700'
                }`}>{c.label}</span>
              </button>
            )
          })}
        </div>

        {revealed && choice && (
          <div className={`p-6 sm:p-8 border-t-2 ${choice.is_correct ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${choice.is_correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                {choice.is_correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${choice.is_correct ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {choice.is_correct ? 'Correct call' : 'Not the strongest call'}
                </p>
                <p className={`text-sm font-medium leading-relaxed ${choice.is_correct ? 'text-emerald-900' : 'text-rose-900'}`}>
                  {choice.rationale}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition text-sm"
              >
                {isLast ? 'Finish scenario' : 'Next decision'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Learning objectives footer */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">What this scenario teaches</p>
        <ul className="space-y-1.5">
          {scenario.learning_objectives.map((o, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
              <span className="text-indigo-500 mt-0.5">▸</span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
