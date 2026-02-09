'use client';

import { useState } from 'react';
import { Search, Star, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiFeaturesAPI } from '@/lib/api';

const TUTORS = [
    { name: 'Dr. Alex Smith', role: 'Senior Software Engineer', rating: 4.9, reviews: 120, seed: 101 },
    { name: 'Sarah Chen', role: 'Data Science Lead', rating: 4.8, reviews: 95, seed: 202 },
    { name: 'Marcus Johnson', role: 'AI/ML Engineer', rating: 5.0, reviews: 88, seed: 303 },
];

export default function TutorPage() {
    const [booked, setBooked] = useState<number | null>(null);
    const [goal, setGoal] = useState('');
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [loadingRec, setLoadingRec] = useState(false);

    const handleBook = (name: string, index: number) => {
        setBooked(index);
        toast.success(`Booking requested with ${name}! We'll confirm via email.`);
    };

    const handleGetRecommendation = async () => {
        const g = goal.trim() || 'career growth in tech';
        setLoadingRec(true);
        setRecommendation(null);
        try {
            const res = await aiFeaturesAPI.tutorRecommendation(g);
            setRecommendation(res.recommendation || '');
        } catch (e: any) {
            const msg = e.response?.data?.detail ?? e.message ?? 'Failed to get recommendation';
            toast.error(msg);
            if (msg.includes('credits') || msg.includes('quota')) {
                toast('Add your Gemini key or buy credits at Manage Credits.', { icon: '💳' });
            }
        } finally {
            setLoadingRec(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                    <Search size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Find a Tutor</h1>
                    <p className="text-slate-500">Connect with experts for 1-on-1 guidance.</p>
                </div>
            </div>

            <div className="card-premium p-6 mb-8">
                <h3 className="font-bold text-lg mb-2">AI tutor recommendation</h3>
                <p className="text-slate-600 text-sm mb-4">Enter your learning goal and get a recommendation on what type of tutor to look for.</p>
                <div className="flex gap-2 flex-wrap">
                    <input
                        type="text"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        placeholder="e.g. Get job-ready in data science"
                        className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
                    />
                    <button
                        onClick={handleGetRecommendation}
                        disabled={loadingRec}
                        className="px-4 py-2 rounded-xl bg-violet-600 text-white font-medium flex items-center gap-2 hover:bg-violet-700 disabled:opacity-60"
                    >
                        <Sparkles size={18} /> {loadingRec ? 'Getting...' : 'Get recommendation'}
                    </button>
                </div>
                {recommendation && (
                    <div className="mt-4 p-4 rounded-xl bg-violet-50 border border-violet-100 text-slate-700 whitespace-pre-wrap">
                        {recommendation}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TUTORS.map((t, i) => (
                    <div key={t.seed} className="card-premium p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}`} alt={t.name} />
                        </div>
                        <h3 className="font-bold text-lg">{t.name}</h3>
                        <p className="text-violet-600 font-medium text-sm mb-3">{t.role}</p>
                        <div className="flex items-center gap-1 text-amber-500 mb-4">
                            <Star size={16} fill="currentColor" />
                            <span className="font-bold text-slate-700">{t.rating}</span>
                            <span className="text-slate-400 text-xs">({t.reviews} reviews)</span>
                        </div>
                        <div className="flex gap-2 w-full">
                            <button className="flex-1 py-2 rounded-xl border border-slate-200 font-medium hover:bg-slate-50">Profile</button>
                            <button
                                onClick={() => handleBook(t.name, i)}
                                className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
                                disabled={booked === i}
                            >
                                {booked === i ? 'Requested' : 'Book'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
