'use client';

import { Gamepad2 } from 'lucide-react';

export default function GamifiedLearningPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                    <Gamepad2 size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gamified Learning</h1>
                    <p className="text-slate-500">Earn XP and compete with others.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card-premium p-8 text-center min-h-[400px] flex flex-col justify-center items-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl shadow-xl shadow-fuchsia-500/20 flex items-center justify-center mb-6 text-white text-4xl">
                        🏆
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Leaderboard Coming Soon!</h2>
                    <p className="text-slate-600">We are calculating global rankings. Check back later.</p>
                </div>

                <div className="card-premium p-6">
                    <h3 className="font-bold text-lg mb-4">Your Achievements</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="aspect-square rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-2 grayscale hover:grayscale-0 transition-all cursor-pointer">
                                <span className="text-2xl">🏅</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
