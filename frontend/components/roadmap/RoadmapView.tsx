'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock, ArrowRight, ExternalLink, Play, BookOpen, Clock } from 'lucide-react';

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
            {/* ... (Header and Progress Bar unchanged, assume existing structure matches) ... */}
            <div className="bg-white rounded-3xl p-8 mb-12 shadow-xl border border-indigo-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-4xl">🗺️</span>
                            <h2 className="text-3xl font-bold text-gray-900">{roadmap.career_path}</h2>
                        </div>
                        <p className="text-gray-600 text-lg max-w-xl">
                            Your personalized expert-curated learning path. Follow the steps to master your career.
                        </p>
                    </div>
                    <div className="glass-panel rounded-2xl p-6 min-w-[200px] text-center">
                        <span className="text-4xl font-bold gradient-text">
                            {Math.round(roadmap.completion_percentage)}%
                        </span>
                        <span className="text-sm text-gray-500 font-medium uppercase tracking-wider block mt-1">Mastery Achieved</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8 relative h-4 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${roadmap.completion_percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute h-full gradient-primary rounded-full"
                    />
                </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-12">
                {/* Connecting Line */}
                <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-gray-200 transform md:-translate-x-1/2 rounded-full" />

                {roadmap.steps.map((step, index) => {
                    const isActive = index === roadmap.current_step;
                    const isCompleted = index < roadmap.current_step;
                    const isLocked = index > roadmap.current_step;
                    const isEven = index % 2 === 0;

                    return (
                        <motion.div
                            key={step.step_number}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex items-center md:justify-between ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                        >
                            {/* Desktop Spacer for alternating layout */}
                            <div className="hidden md:block w-5/12" />

                            {/* Center Icon Node - CLICKABLE */}
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

                            {/* Content Card - CLICKABLE */}
                            <div className={`w-full md:w-5/12 ml-20 md:ml-0 pl-0 ${isEven ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                                <div
                                    onClick={() => onNodeClick && onNodeClick(step)}
                                    className={`group relative bg-white p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${isActive ? 'border-indigo-600 shadow-xl ring-1 ring-indigo-50' :
                                        isCompleted ? 'border-indigo-100 opacity-90' :
                                            'border-gray-200 opacity-80 hover:border-indigo-200'
                                        }`}
                                >
                                    {/* Step Label */}
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

                                    {/* Interactive Content for Active Step */}
                                    {isActive && (
                                        <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                                            {/* Stop propagation so clicking buttons inside doesn't trigger the main card click if we don't want it to, 
                                                but actually clicking the card to learn is fine. Maybe the 'Complete' button should do its own thing. */}

                                            <div className="flex flex-wrap gap-2 justify-start md:justify-[inherit]">
                                                {step.skills.map(skill => (
                                                    <span key={skill} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium border border-indigo-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Resources - Keep links clickable */}
                                            {step.resources?.length > 0 && (
                                                <div className="bg-gray-50 rounded-xl p-4 text-left">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-3">
                                                        <BookOpen size={16} className="text-indigo-600" />
                                                        Learning Resources
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {step.resources.map((resource, i) => (
                                                            <li key={i}>
                                                                <a
                                                                    href={resource.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors p-2 hover:bg-white rounded-lg group/link"
                                                                >
                                                                    <div className="w-1 h-1 bg-indigo-400 rounded-full group-hover/link:bg-indigo-600"></div>
                                                                    <span className="truncate flex-1">{resource.name}</span>
                                                                    <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => onUpdateProgress(step.step_number + 1)}
                                                disabled={isUpdating}
                                                className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:transform-none"
                                            >
                                                {isUpdating ? 'Updating Progress...' : 'Complete & Continue'}
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
