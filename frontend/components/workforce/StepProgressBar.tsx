'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { STEPS } from '@/lib/workforceState'

interface StepProgressBarProps {
    currentStep: number
    /** Latest step the user is allowed to navigate to (defaults to currentStep) */
    maxReachable?: number
}

export default function StepProgressBar({ currentStep, maxReachable }: StepProgressBarProps) {
    const max = maxReachable ?? currentStep

    return (
        <div className="relative w-full">
            {/* Connector line behind dots */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 mx-12" aria-hidden />
            <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 mx-12 transition-all duration-700"
                style={{ width: `calc((100% - 6rem) * ${Math.max(0, currentStep - 1)} / ${STEPS.length - 1})` }}
                aria-hidden
            />

            <ol className="relative flex items-start justify-between">
                {STEPS.map((step) => {
                    const done = step.number < currentStep
                    const active = step.number === currentStep
                    const reachable = step.number <= max
                    const Tag = reachable ? Link : 'div'
                    const sharedClasses = `flex flex-col items-center gap-2 group transition-all ${reachable ? 'cursor-pointer' : 'cursor-default'}`

                    const content = (
                        <>
                            <div
                                className={`relative w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all shadow-sm ${
                                    done
                                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                                        : active
                                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-violet-200 ring-4 ring-violet-100'
                                        : reachable
                                        ? 'bg-white border-2 border-slate-200 text-slate-500 group-hover:border-violet-400'
                                        : 'bg-white border-2 border-slate-200 text-slate-400'
                                }`}
                            >
                                {done ? <Check className="w-5 h-5" /> : step.number}
                            </div>
                            <span
                                className={`text-[11px] font-bold tracking-wide text-center max-w-[110px] leading-tight ${
                                    active ? 'text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'
                                }`}
                            >
                                {step.label}
                            </span>
                        </>
                    )

                    if (reachable) {
                        return (
                            <li key={step.number} className="relative z-10">
                                <Link href={step.href} className={sharedClasses}>
                                    {content}
                                </Link>
                            </li>
                        )
                    }
                    return (
                        <li key={step.number} className="relative z-10">
                            <div className={sharedClasses}>{content}</div>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
