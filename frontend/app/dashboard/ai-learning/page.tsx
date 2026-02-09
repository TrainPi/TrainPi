'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { lessonsAPI, aiFeaturesAPI } from '@/lib/api';

export default function AILearningPage() {
    const [lessons, setLessons] = useState<{ id: number; title: string; modules?: any[]; quiz_questions?: any[]; created_at?: string }[]>([]);
    const [topic, setTopic] = useState('');
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        lessonsAPI.getMyLessons().then((data: any) => {
            const list = Array.isArray(data) ? data : (data?.lessons ?? []);
            setLessons(list);
        }).catch(() => setLessons([]));
    }, []);

    const handleGenerateLesson = async () => {
        const t = topic.trim() || 'General skills';
        setGenerating(true);
        toast.loading('Generating lesson with AI...');
        try {
            const generated = await aiFeaturesAPI.generateLesson(t);
            if (!generated?.title || !Array.isArray(generated.modules)) {
                toast.error('AI could not generate a valid lesson.');
                return;
            }
            const created = await lessonsAPI.createFromAI({
                title: generated.title,
                modules: generated.modules,
                quiz_questions: generated.quiz_questions ?? [],
            });
            toast.dismiss();
            toast.success('Lesson created! It appears in My Lessons.');
            setLessons(prev => [{ ...created, id: created.id ?? Date.now(), title: created.title }, ...prev]);
            setTopic('');
        } catch (e: any) {
            toast.dismiss();
            const msg = e.response?.data?.detail ?? e.message ?? 'Failed to generate lesson';
            toast.error(msg);
            if (msg.includes('credits') || msg.includes('quota')) {
                toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' });
            }
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                    <Sparkles size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">AI Learning</h1>
                    <p className="text-slate-500">Your personalized AI-curated learning feed.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-premium p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center mb-6">
                        <span className="text-4xl">🤖</span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">AI Content Generator</h2>
                    <p className="text-slate-600 mb-2 max-w-md">
                        Enter a topic and our AI (Gemini) will generate a custom lesson with modules and quiz.
                    </p>
                    <p className="text-xs text-slate-500 mb-4">Uses 5 credits or your Gemini key (Manage Credits).</p>
                    <div className="flex gap-2 w-full max-w-md mb-4">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. React Hooks, Python basics"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                        />
                        <button
                            onClick={handleGenerateLesson}
                            disabled={generating}
                            className="btn-primary whitespace-nowrap disabled:opacity-60"
                        >
                            {generating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>

                <div className="card-premium p-6">
                    <h3 className="font-bold text-lg mb-4">My Lessons</h3>
                    <div className="space-y-4">
                        {lessons.length === 0 && (
                            <p className="text-slate-500 text-sm">No lessons yet. Generate one above or visit Learn.</p>
                        )}
                        {lessons.map((lesson) => (
                            <Link
                                key={lesson.id}
                                href={`/learn/${lesson.id}`}
                                className="block p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-200 transition-colors"
                            >
                                <h4 className="font-bold text-slate-800 mb-1">{lesson.title}</h4>
                                <p className="text-sm text-slate-500">
                                    {Array.isArray(lesson.modules) ? `${lesson.modules.length} modules` : 'View lesson'}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
