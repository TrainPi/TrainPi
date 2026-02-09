'use client';

import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiFeaturesAPI } from '@/lib/api';

const PROBLEMS = [
    { id: 1, title: 'Algorithm Challenge #1', difficulty: 'Medium', xp: 50, prompt: 'Implement a solution that meets the problem requirements. Test with edge cases (empty input, single item, duplicates).' },
    { id: 2, title: 'Data Structures: Arrays', difficulty: 'Easy', xp: 30, prompt: 'Practice array operations: traversal, filtering, and transformation. Use your preferred language and environment.' },
    { id: 3, title: 'System Design Basics', difficulty: 'Hard', xp: 80, prompt: 'Outline a high-level design: components, data flow, and scaling considerations. Document your assumptions.' },
    { id: 4, title: 'Code Review Practice', difficulty: 'Medium', xp: 50, prompt: 'Review a code snippet (from a project or sample). List improvements for readability, performance, and correctness.' },
];

export default function PracticePage() {
    const [started, setStarted] = useState<number | null>(null);
    const [completed, setCompleted] = useState<Set<number>>(new Set());
    const [hintFor, setHintFor] = useState<number | null>(null);
    const [hint, setHint] = useState('');
    const [loadingHint, setLoadingHint] = useState(false);

    const handleStart = (id: number) => {
        setStarted(id);
        toast.success(`Started: ${PROBLEMS.find(p => p.id === id)?.title}. Good luck!`);
    };

    const handleComplete = (p: typeof PROBLEMS[0]) => {
        setCompleted(prev => new Set(prev).add(p.id));
        setStarted(null);
        toast.success(`Completed "${p.title}" — ${p.xp} XP earned!`);
    };

    const handleGetHint = async (title: string, id: number) => {
        setLoadingHint(true);
        setHintFor(id);
        setHint('');
        try {
            const res = await aiFeaturesAPI.practiceHint(title);
            setHint(res.hint || '');
        } catch (e: any) {
            const msg = e.response?.data?.detail ?? e.message ?? 'Failed to get hint';
            toast.error(msg);
            if (msg.includes('credits') || msg.includes('quota')) {
                toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' });
            }
        } finally {
            setLoadingHint(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <BookOpen size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Practice Problems</h1>
                    <p className="text-slate-500">Sharpen your skills with hands-on challenges.</p>
                </div>
            </div>

            <div className="card-premium p-6">
                <div className="space-y-4">
                    {PROBLEMS.map((p) => (
                        <div key={p.id} className="p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                        {p.id}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{p.title}</h4>
                                        <p className="text-sm text-slate-500">Difficulty: {p.difficulty} • {p.xp} XP</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleGetHint(p.title, p.id)}
                                        disabled={loadingHint}
                                        className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 flex items-center gap-1 disabled:opacity-60"
                                    >
                                        <Sparkles size={14} /> {loadingHint && hintFor === p.id ? '...' : 'Get AI hint'}
                                    </button>
                                    <button
                                        onClick={() => handleStart(p.id)}
                                        disabled={completed.has(p.id)}
                                        className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-60 disabled:bg-emerald-600"
                                    >
                                        {completed.has(p.id) ? 'Completed' : started === p.id ? 'In progress' : 'Start'}
                                    </button>
                                </div>
                            </div>
                            {started === p.id && (
                                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                                    <h5 className="font-semibold text-slate-800 mb-2">Your task</h5>
                                    <p className="text-slate-600 text-sm mb-4">{(p as any).prompt || 'Solve this problem in your preferred environment. Use Get AI hint if you get stuck.'}</p>
                                    <button
                                        onClick={() => handleComplete(p)}
                                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                                    >
                                        Mark complete (+{p.xp} XP)
                                    </button>
                                </div>
                            )}
                            {hintFor === p.id && hint && (
                                <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-slate-700">
                                    <span className="font-medium text-emerald-800">Hint: </span>{hint}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
