'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface CreateRoadmapProps {
  onSelect: (goal: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  'Become a full-stack web developer',
  'Get a job as a data scientist',
  'Learn Python for AI and machine learning',
  'Become a DevOps / cloud engineer',
  'Master UI/UX design',
  'Build mobile apps with React Native',
];

export default function CreateRoadmap({ onSelect, isLoading }: CreateRoadmapProps) {
  const [goal, setGoal] = useState('');

  const handleSubmit = () => {
    const g = goal.trim();
    if (!g || isLoading) return;
    onSelect(g);
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-violet-200 mb-8">
        <Sparkles size={36} className="text-white" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-3">
        What do you want to achieve?
      </h1>
      <p className="text-slate-500 text-center max-w-md mb-10">
        Tell us your goal in plain words. Our AI will build you a personalised,
        step-by-step roadmap to get there.
      </p>

      <div className="w-full max-w-xl space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. I want to become a software engineer…"
            className="flex-1 px-5 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 placeholder:text-slate-400"
            disabled={isLoading}
            autoFocus
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !goal.trim()}
            className="px-5 py-4 rounded-2xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50 transition flex items-center gap-2 shrink-0 shadow-lg shadow-violet-200"
          >
            {isLoading
              ? <><Loader2 size={18} className="animate-spin" /> Generating…</>
              : <><ArrowRight size={18} /> Build Roadmap</>}
          </button>
        </div>

        {!isLoading && (
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setGoal(s); onSelect(s); }}
                className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs text-slate-600 hover:border-violet-400 hover:text-violet-700 hover:bg-violet-50 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="text-center pt-6">
            <p className="text-sm text-slate-500 animate-pulse">AI is building your personalised roadmap…</p>
            <div className="mt-3 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
