'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock, ArrowRight, ExternalLink } from 'lucide-react';

interface Resource {
    name: string;
    url: string;
}

interface Step {
    step_number: int;
    title: string;
    description: string;
    skills: string[];
    resources: Resource[];
}

interface Roadmap {
    id: int;
    career_path: string;
    steps: Step[];
    current_step: int;
    completion_percentage: float;
}

interface RoadmapViewProps {
    roadmap: Roadmap;
    onUpdateProgress: (stepNumber: int) => void;
    isUpdating: boolean;
}

export default function RoadmapView({ roadmap, onUpdateProgress, isUpdating }: RoadmapViewProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900">{roadmap.career_path} Roadmap</h2>
                        <p className="text-slate-600">Your personalized path to mastery.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-brand-DEFAULT">
                            {Math.round(roadmap.completion_percentage)}%
                        </span>
                        <span className="text-sm text-slate-500 block">completed</span>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${roadmap.completion_percentage}%` }}
                        className="h-full bg-brand-DEFAULT rounded-full"
                    />
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-slate-200" />

                {roadmap.steps.map((step, index) => {
                    const isActive = index === roadmap.current_step;
                    const isCompleted = index < roadmap.current_step;
                    const isLocked = index > roadmap.current_step;

                    return (
                        <motion.div
                            key={step.step_number}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative pl-24 pr-8 py-8 rounded-2xl border transition-all ${isActive
                                    ? 'bg-white border-brand-DEFAULT shadow-lg ring-1 ring-brand-DEFAULT/20'
                                    : 'bg-white border-slate-200 opacity-80'
                                }`}
                        >
                            {/* Status Icon */}
                            <div className={`absolute left-4 top-8 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${isCompleted ? 'bg-brand-DEFAULT text-white' :
                                    isActive ? 'bg-white border-2 border-brand-DEFAULT text-brand-DEFAULT' :
                                        'bg-slate-100 text-slate-400'
                                }`}>
                                {isCompleted ? <CheckCircle2 size={20} /> :
                                    isActive ? <Circle size={20} className="fill-brand-DEFAULT/20" /> :
                                        <Lock size={16} />}
                            </div>

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <h3 className={`text-xl font-bold mb-2 ${isActive ? 'text-brand-dark' : 'text-slate-900'}`}>
                                        Step {step.step_number}: {step.title}
                                    </h3>
                                    <p className="text-slate-600 mb-4">{step.description}</p>

                                    {isActive && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {step.skills.map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-brand-light text-brand-dark text-sm rounded-full font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {isActive && step.resources?.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-100">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-2">Recommended Resources:</h4>
                                            <ul className="space-y-2">
                                                {step.resources.map((resource, i) => (
                                                    <li key={i}>
                                                        <a
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center text-brand-DEFAULT hover:underline text-sm"
                                                        >
                                                            <ExternalLink size={14} className="mr-2" />
                                                            {resource.name}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {isActive && (
                                    <button
                                        onClick={() => onUpdateProgress(step.step_number + 1)}
                                        disabled={isUpdating}
                                        className="shrink-0 px-6 py-3 bg-brand-DEFAULT text-white rounded-lg font-semibold hover:bg-brand-dark transition-colors flex items-center shadow-lg shadow-brand-DEFAULT/20 disabled:opacity-50"
                                    >
                                        {isUpdating ? 'Updating...' : 'Complete Step'}
                                        <ArrowRight size={18} className="ml-2" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
