'use client';

import { BookOpen } from 'lucide-react';

export default function PracticePage() {
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
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                    {i}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Algorithm Challenge #{i}</h4>
                                    <p className="text-sm text-slate-500">Difficulty: Medium • 50 XP</p>
                                </div>
                            </div>
                            <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800">
                                Start
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
