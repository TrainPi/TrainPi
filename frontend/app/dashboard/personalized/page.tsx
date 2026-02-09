'use client';

import { useState } from 'react';
import { BrainCircuit, BookOpen, Video, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { aiFeaturesAPI } from '@/lib/api';

const RECOMMENDED = [
    { title: 'Visual: Diagrams & flowcharts', desc: 'Core concepts with visual aids', icon: Video, href: '/dashboard/ai-learning' },
    { title: 'Interactive: Hands-on exercises', desc: 'Practice problems and quizzes', icon: Zap, href: '/dashboard/practice' },
    { title: 'Structured: Step-by-step modules', desc: 'Roadmap and lesson sequence', icon: BookOpen, href: '/dashboard' },
];

export default function PersonalizedLearningPage() {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGetAnalysis = async () => {
        setLoading(true);
        setAnalysis(null);
        try {
            const res = await aiFeaturesAPI.learningStyle();
            setAnalysis(res.analysis || '');
        } catch (e: any) {
            const msg = e.response?.data?.detail ?? e.message ?? 'Failed to get analysis';
            toast.error(msg);
            if (msg.includes('credits') || msg.includes('quota')) {
                toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <BrainCircuit size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Personalized Learning</h1>
                    <p className="text-slate-500">Adapting to your unique learning style.</p>
                </div>
            </div>

            <div className="card-premium p-8 md:p-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">Learning Style Analysis</h2>
                    <button
                        onClick={handleGetAnalysis}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-amber-500 text-white font-medium flex items-center gap-2 hover:bg-amber-600 disabled:opacity-60"
                    >
                        <Sparkles size={18} /> {loading ? 'Analyzing...' : 'Get AI analysis'}
                    </button>
                </div>
                <div className="max-w-xl mb-8">
                    <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                        <span>Visual</span>
                        <span>Kinesthetic</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-[65%]"></div>
                    </div>
                    {analysis ? (
                        <p className="mt-4 text-slate-600 whitespace-pre-wrap">{analysis}</p>
                    ) : (
                        <p className="mt-4 text-slate-600">
                            Click &quot;Get AI analysis&quot; to receive a personalized learning style recommendation powered by Gemini.
                        </p>
                    )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-4">Recommended for you</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {RECOMMENDED.map((r) => (
                        <Link
                            key={r.title}
                            href={r.href}
                            className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all"
                        >
                            <r.icon className="w-8 h-8 text-amber-600 mb-2" />
                            <h4 className="font-bold text-slate-800">{r.title}</h4>
                            <p className="text-sm text-slate-500">{r.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
