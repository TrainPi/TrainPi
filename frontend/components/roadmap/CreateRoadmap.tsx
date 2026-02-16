'use client';

import { motion } from 'framer-motion';
import { Code, BarChart, ChevronRight } from 'lucide-react';

interface CreateRoadmapProps {
    onSelect: (path: string) => void;
    isLoading: boolean;
}

const CAREER_PATHS = [
    {
        id: 'Software Engineer',
        title: 'Software Development',
        description: 'Master full-stack development, algorithms, and system design.',
        icon: Code,
        color: 'bg-indigo-500'
    },
    {
        id: 'Data Analyst',
        title: 'Data Analysis',
        description: 'Learn to analyze data, build models, and visualize insights.',
        icon: BarChart,
        color: 'bg-blue-500'
    },
    {
        id: 'AI Engineer',
        title: 'AI Engineering',
        description: 'Specialize in machine learning, neural networks, and LLMs.',
        icon: Code,
        color: 'bg-emerald-500'
    }
];

export default function CreateRoadmap({ onSelect, isLoading }: CreateRoadmapProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    Choose Your Path
                </h2>
                <p className="text-lg text-slate-600">
                    Select a career track to generate your personalized AI roadmap.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {CAREER_PATHS.map((path, index) => (
                    <motion.button
                        key={path.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onSelect(path.id)}
                        disabled={isLoading}
                        className="group relative p-8 bg-white rounded-2xl border border-slate-200 hover:border-brand-DEFAULT hover:shadow-xl transition-all text-left flex flex-col h-full"
                    >
                        <div className={`w-12 h-12 rounded-xl ${path.color} text-white flex items-center justify-center mb-6 shadow-lg`}>
                            <path.icon size={24} />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-brand-DEFAULT transition-colors">
                            {path.title}
                        </h3>

                        <p className="text-slate-600 mb-8 flex-grow">
                            {path.description}
                        </p>

                        <div className="flex items-center text-brand-DEFAULT font-semibold group-hover:translate-x-1 transition-transform">
                            start Roadmap <ChevronRight size={20} className="ml-1" />
                        </div>

                        {isLoading && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-DEFAULT" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
