'use client';

import { BrainCircuit } from 'lucide-react';

export default function PersonalizedLearningPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <BrainCircuit size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Personalized Learning</h1>
                    <p className="text-slate-500">Adapting to your unique learning style.</p>
                </div>
            </div>

            <div className="card-premium p-12 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Learning Style Analysis</h2>
                <div className="max-w-xl mx-auto mb-8">
                    <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                        <span>Visual</span>
                        <span>Kinesthetic</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 w-[65%]"></div>
                    </div>
                    <p className="mt-4 text-slate-600">
                        You learn best through visual aids and interactive diagrams. We have adjusted your curriculum accordingly.
                    </p>
                </div>
            </div>
        </div>
    );
}
