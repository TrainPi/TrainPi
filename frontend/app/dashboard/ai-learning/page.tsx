'use client';

import { Sparkles } from 'lucide-react';

export default function AILearningPage() {
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
                    <p className="text-slate-600 mb-8 max-w-md">
                        Our AI is currently analyzing your learning patterns to generate custom content.
                    </p>
                    <button className="btn-primary">Generate New Lesson</button>
                </div>

                <div className="card-premium p-6">
                    <h3 className="font-bold text-lg mb-4">Recommended for You</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-200 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-violet-100 text-violet-700 text-xs px-2 py-1 rounded-md font-bold">New</span>
                                    <span className="text-slate-400 text-sm">10 min</span>
                                </div>
                                <h4 className="font-bold text-slate-800 mb-1">Advanced React Patterns {i}</h4>
                                <p className="text-sm text-slate-500">Master the art of component composition.</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
