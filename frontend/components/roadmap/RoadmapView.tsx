'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, Circle, Play, ArrowRight, Clock,
  Sparkles, RotateCcw, Briefcase, BookOpen, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { resolveCourseForStep } from '@/lib/courseMatch';
import toast from 'react-hot-toast';

interface Step {
  step_number: number;
  title: string;
  description: string;
  skills: string[];
  estimated_time?: string;
}

interface Roadmap {
  id: number;
  career_path: string;
  steps: Step[];
  current_step: number;
  completion_percentage: number;
}

interface RoadmapViewProps {
  roadmap: Roadmap;
  onUpdateProgress: (stepNumber: number) => void;
  isUpdating: boolean;
  onReset?: () => void;
}

export default function RoadmapView({ roadmap, onUpdateProgress, isUpdating, onReset }: RoadmapViewProps) {
  const router = useRouter();
  const steps = Array.isArray(roadmap.steps) ? roadmap.steps : [];
  const pct = Math.round(roadmap.completion_percentage || 0);
  const [expandedStep, setExpandedStep] = useState<number>(roadmap.current_step);
  const [resolvingStep, setResolvingStep] = useState<number | null>(null);

  const handleLearnTopic = async (step: Step) => {
    setResolvingStep(step.step_number);
    try {
      const match = await resolveCourseForStep(step.title, step.skills);
      if (match.type === 'curated') {
        router.push(`/catalog/${match.course.id}`);
      } else if (match.type === 'video') {
        // No curated course covers this topic — open the best-matched
        // fallback video directly rather than inventing a fake catalog route.
        window.open(`https://www.youtube.com/watch?v=${match.video_id}`, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Could not find a matching lesson for this topic yet.');
        router.push('/catalog');
      }
    } finally {
      setResolvingStep(null);
    }
  };

  const readinessScore = Math.min(100, Math.round(pct * 0.8 + (steps.length > 0 ? 20 : 0)));
  const readinessLabel =
    readinessScore >= 80 ? 'Job Ready 🎉' :
    readinessScore >= 50 ? 'Getting There' :
    readinessScore >= 20 ? 'In Progress' : 'Just Started';
  const readinessColor =
    readinessScore >= 80 ? 'text-emerald-600' :
    readinessScore >= 50 ? 'text-amber-600' : 'text-violet-600';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-7 text-white shadow-xl shadow-violet-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-violet-200" />
                <span className="text-[11px] font-black uppercase tracking-widest text-violet-200">Your Roadmap</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{roadmap.career_path}</h1>
            </div>
            {onReset && (
              <button
                onClick={onReset}
                className="shrink-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20"
              >
                <RotateCcw size={12} /> New Roadmap
              </button>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-violet-200 font-medium">Overall Progress</span>
              <span className="font-black text-lg">{pct}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-violet-200 text-xs mt-2">{roadmap.current_step} of {steps.length} steps completed</p>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15">
            <Briefcase size={13} />
            <span className="text-xs font-bold">Job Readiness:</span>
            <span className="text-xs font-black">{readinessLabel} ({readinessScore}%)</span>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < roadmap.current_step;
          const isActive = index === roadmap.current_step;
          const isLocked = index > roadmap.current_step;
          const isExpanded = expandedStep === index;

          return (
            <div
              key={step.step_number}
              className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                isActive ? 'border-violet-300 shadow-md shadow-violet-100' :
                isCompleted ? 'border-emerald-100' : 'border-slate-100'
              }`}
            >
              <button
                className="w-full flex items-center gap-4 p-5 text-left"
                onClick={() => setExpandedStep(isExpanded ? -1 : index)}
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-emerald-100' : isActive ? 'bg-violet-100' : 'bg-slate-100'
                }`}>
                  {isCompleted
                    ? <CheckCircle2 size={20} className="text-emerald-600" />
                    : isActive
                    ? <Play size={17} className="text-violet-600 fill-violet-600 ml-0.5" />
                    : <Circle size={17} className="text-slate-300" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      isCompleted ? 'text-emerald-500' : isActive ? 'text-violet-500' : 'text-slate-400'
                    }`}>Step {step.step_number}</span>
                    {step.estimated_time && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock size={9} /> {step.estimated_time}
                      </span>
                    )}
                    {isCompleted && <span className="text-[10px] text-emerald-500 font-bold">✓ Done</span>}
                    {isActive && <span className="text-[10px] text-violet-500 font-bold">● Active</span>}
                  </div>
                  <p className={`font-black text-sm leading-snug ${isLocked ? 'text-slate-400' : 'text-slate-900'}`}>
                    {step.title}
                  </p>
                </div>

                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-50">
                  <p className="text-sm text-slate-600 leading-relaxed pt-4">{step.description}</p>

                  {step.skills && step.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {step.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-violet-50 text-violet-700 text-xs rounded-lg font-medium border border-violet-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    {isActive && (
                      <button
                        onClick={() => onUpdateProgress(step.step_number)}
                        disabled={isUpdating}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 transition shadow-lg shadow-violet-200"
                      >
                        {isUpdating ? 'Saving…' : 'Complete Step'} <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleLearnTopic(step)}
                      disabled={resolvingStep === step.step_number}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 disabled:opacity-60 transition"
                    >
                      {resolvingStep === step.step_number ? (
                        <><Loader2 size={14} className="animate-spin" /> Finding lesson…</>
                      ) : (
                        <><BookOpen size={14} /> Learn this topic</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Job Readiness card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Briefcase size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Job Readiness</p>
            <p className={`font-black text-lg ${readinessColor}`}>{readinessLabel}</p>
          </div>
          <div className="ml-auto text-3xl font-black text-slate-900">{readinessScore}%</div>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              readinessScore >= 80 ? 'bg-emerald-500' : readinessScore >= 50 ? 'bg-amber-500' : 'bg-violet-500'
            }`}
            style={{ width: `${readinessScore}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          {pct < 80
            ? `Complete more steps to improve your score. ${80 - pct > 0 ? `${80 - pct}% more progress needed for job-ready status.` : ''}`
            : 'You are job ready! Start applying.'}
        </p>
      </div>
    </div>
  );
}
