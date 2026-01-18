'use client';

import { Search, Star } from 'lucide-react';

export default function TutorPage() {
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card-premium p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full bg-slate-200 mb-4 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="Tutor" />
                        </div>
                        <h3 className="font-bold text-lg">Dr. Alex Smith</h3>
                        <p className="text-violet-600 font-medium text-sm mb-3">Senior Software Engineer</p>
                        <div className="flex items-center gap-1 text-amber-500 mb-4">
                            <Star size={16} fill="currentColor" />
                            <span className="font-bold text-slate-700">4.9</span>
                            <span className="text-slate-400 text-xs">(120 reviews)</span>
                        </div>
                        <div className="flex gap-2 w-full">
                            <button className="flex-1 py-2 rounded-xl border border-slate-200 font-medium hover:bg-slate-50">Profile</button>
                            <button className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700">Book</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
