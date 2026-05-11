'use client';

import { useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiFeaturesAPI } from '@/lib/api';

const PROBLEMS = [
    {
        id: 1,
        title: 'Phishing Investigation: User Clicked a Suspicious Link',
        difficulty: 'Medium',
        xp: 60,
        prompt: 'Scenario: A user calls the help desk and reports they clicked a link in an email that looked like it came from IT. They are now seeing an unfamiliar login prompt asking for their credentials. As the SOC analyst on duty: (1) What do you investigate first? (2) What evidence do you collect and preserve? (3) What containment steps do you take immediately? (4) At what point do you escalate, and to whom? Document your response as you would in a real incident ticket.',
    },
    {
        id: 2,
        title: 'MFA Alert Triage: Suspicious Login from Unknown Location',
        difficulty: 'Medium',
        xp: 60,
        prompt: 'Scenario: Your SIEM fires an alert — a user account has a successful login from an IP address in a country the user has never logged in from before, followed immediately by an MFA push notification. The user has not reported anything unusual. As the analyst: (1) Is this an active threat or a false positive? What determines that? (2) What logs do you review to investigate? (3) Do you disable the account, notify the user, or monitor first? (4) Write the ticket with your findings and recommended next action.',
    },
    {
        id: 3,
        title: 'Incident Ticket Documentation: Malware Detection on Endpoint',
        difficulty: 'Easy',
        xp: 40,
        prompt: 'Scenario: An EDR alert fires indicating a suspicious process was detected and quarantined on a workstation belonging to a Finance department employee. No lateral movement has been detected yet. Your task: Write a complete incident ticket including (1) Incident summary, (2) Severity classification and justification, (3) Timeline of events based on the alert, (4) Containment actions taken, (5) Recommended next steps for Tier 2 escalation. Use clear, analyst-standard language.',
    },
    {
        id: 4,
        title: 'Escalation Decision: When to Escalate vs. Contain Independently',
        difficulty: 'Hard',
        xp: 90,
        prompt: 'Scenario: You are a Tier 1 SOC analyst. You have three open alerts this shift: (A) A user account with 12 failed logins in 5 minutes, then a successful login — no MFA triggered. (B) An endpoint detection showing PowerShell executing encoded commands — process was not quarantined automatically. (C) A phishing email reported by 3 different users containing the same malicious link — no one clicked it yet. For each alert: (1) What is your severity level? (2) Do you handle it at Tier 1 or escalate? (3) What is your immediate action? Justify each decision with operational reasoning.',
    },
    {
        id: 5,
        title: 'IAM Workflow: Suspicious Access Review Finding',
        difficulty: 'Medium',
        xp: 60,
        prompt: 'Scenario: During a quarterly access review, you discover that a user who transferred departments 6 months ago still has admin-level access to systems in their old department. They have not used that access recently, but it has not been revoked. As the IAM analyst: (1) Is this a security incident or a compliance finding? (2) What is the immediate remediation step? (3) What process failure allowed this to happen? (4) What should be added to the access review process to prevent recurrence? Document your findings.',
    },
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
                    <h1 className="text-3xl font-bold text-slate-900">Operational Scenarios</h1>
                    <p className="text-slate-500">Practice real cybersecurity workflows — investigate, triage, document, and decide like a working analyst.</p>
                </div>
            </div>

            <div className="card-premium p-6">
                <div className="space-y-4">
                    {PROBLEMS.map((p) => (
                        <div key={p.id} className="p-4 rounded-xl bg-white border border-slate-100 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
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
