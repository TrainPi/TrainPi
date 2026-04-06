'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock, ArrowRight, Play, BookOpen, Clock, Sparkles } from 'lucide-react';
import { getReferenceSources } from '@/lib/trainpiLearning';

interface Resource {
    name: string;
    url: string;
}

interface Step {
    step_number: number;
    title: string;
    description: string;
    skills: string[];
    resources: Resource[];
    estimated_time?: string;
}

interface Roadmap {
    id: number;
    career_path: string;
    steps: Step[];
    current_step: number;
    completion_percentage: number;
}

interface RoadmapViewProps {
    roadmap: Roadmap;
    onUpdateProgress: (stepNumber: number) => void;
    isUpdating: boolean;
    onNodeClick?: (step: Step) => void;
}

export default function RoadmapView({ roadmap, onUpdateProgress, isUpdating, onNodeClick }: RoadmapViewProps) {
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-12">
                <div className="relative overflow-hidden bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 p-8 sm:p-12 shadow-2xl shadow-indigo-100">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left flex-1">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest mb-6 shadow-lg shadow-indigo-200">
                                <Sparkles size={14} /> Career Evolution Path
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                                {roadmap.career_path}
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
                                A meticulously crafted AI learning path designed to take you from <span className="font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-4">beginner</span> to <span className="font-bold text-purple-600 underline decoration-purple-200 underline-offset-4">job-ready</span>.
                            </p>
                        </div>

                        <div className="relative w-48 h-48 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <motion.circle
                                    cx="96" cy="96" r="88"
                                    stroke="currentColor" strokeWidth="12"
                                    fill="transparent"
                                    strokeDasharray={2 * Math.PI * 88}
                                    initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                                    animate={{ strokeDashoffset: 2 * Math.PI * 88 * (1 - roadmap.completion_percentage / 100) }}
                                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                                    strokeLinecap="round"
                                    className="text-indigo-600"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-slate-900">{Math.round(roadmap.completion_percentage)}%</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Profile Mastery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative space-y-12">
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 transform md:-translate-x-1/2 rounded-full" />

                {(Array.isArray(roadmap.steps) ? roadmap.steps : []).map((step, index) => {
                    const isActive = index === roadmap.current_step;
                    const isCompleted = index < roadmap.current_step;
                    const isEven = index % 2 === 0;
                    const referenceSources = getReferenceSources(step);

                    return (
                        <motion.div
                            key={step.step_number}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex items-center md:justify-between ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                        >
                            <div className="hidden md:block w-5/12" />

                            <button
                                onClick={() => onNodeClick && onNodeClick(step)}
                                className={`absolute left-8 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-16 h-16 rounded-full border-4 z-20 shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer ${isCompleted ? 'bg-indigo-600 border-indigo-100 text-white' :
                                    isActive ? 'bg-white border-indigo-600 text-indigo-600 scale-110 ring-4 ring-indigo-50' :
                                        'bg-white border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-300'
                                    }`}
                                title="Click to learn about this topic"
                            >
                                {isCompleted ? <CheckCircle2 size={32} /> :
                                    isActive ? (
                                        <div className="relative">
                                            <Play size={28} className="ml-1 fill-current" />
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                            </span>
                                        </div>
                                    ) : <Lock size={24} />}
                            </button>

                            <div className={`w-full md:w-5/12 ml-20 md:ml-0 pl-0 ${isEven ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                                <div
                                    onClick={() => onNodeClick && onNodeClick(step)}
                                    className={`group relative bg-white p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${isActive ? 'border-indigo-600 shadow-xl ring-1 ring-indigo-50' :
                                        isCompleted ? 'border-indigo-100 opacity-90' :
                                            'border-gray-200 opacity-80 hover:border-indigo-200'
                                        }`}
                                >
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${isActive ? 'bg-indigo-600 text-white' :
                                        isCompleted ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-500'
                                        } ${isEven ? 'md:flex-row-reverse' : ''}`}>
                                        Step {step.step_number}
                                        {step.estimated_time && (
                                            <span className="flex items-center gap-1 opacity-80 border-l border-white/20 pl-2 ml-2">
                                                <Clock size={12} /> {step.estimated_time}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{step.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{step.description}</p>

                                    {isActive && (
                                        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-wrap gap-2 justify-start md:justify-[inherit]">
                                                {step.skills.map(skill => (
                                                    <span key={skill} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium border border-indigo-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {referenceSources.length > 0 && (
                                                <div className="bg-gray-50 rounded-xl p-4 text-left">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-2">
                                                        <BookOpen size={16} className="text-indigo-600" />
                                                        Reference sources
                                                    </h4>
                                                    <p className="text-xs text-gray-500 mb-3">
                                                        These are used to shape the TrainPi lesson plan. Learners stay on-platform instead of being sent to external websites.
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {referenceSources.map((name) => (
                                                            <li key={name} className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm text-gray-700">
                                                                {name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => onUpdateProgress(step.step_number)}
                                                disabled={isUpdating}
                                                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
                                            >
                                                {isUpdating ? 'Updating Progress...' : 'Complete and Continue'}
                                                <ArrowRight size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
