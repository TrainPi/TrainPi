'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, History, Loader2, Key, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { creditsAPI, authAPI } from '@/lib/api';
import Link from 'next/link';

const GEMINI_APKEY_URL = 'https://aistudio.google.com/apikey';

const PACKAGES = [
    { id: '100', credits: 100, label: '100 Credits', price: '$4.99', popular: false },
    { id: '500', credits: 500, label: '500 Credits', price: '$19.99', popular: true },
    { id: '1000', credits: 1000, label: '1000 Credits', price: '$34.99', popular: false },
    { id: '2500', credits: 2500, label: '2500 Credits', price: '$79.99', popular: false },
];

type Tx = { id: number; amount: number; kind: string; description: string | null; created_at: string };

function CreditsPageContent() {
    const searchParams = useSearchParams();
    const [balance, setBalance] = useState<number | null>(null);
    const [history, setHistory] = useState<Tx[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const [hasGeminiKey, setHasGeminiKey] = useState<boolean | null>(null);
    const [geminiKeyInput, setGeminiKeyInput] = useState('');
    const [savingKey, setSavingKey] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([creditsAPI.getBalance(), creditsAPI.getHistory(), authAPI.getMe().catch(() => null)])
            .then(([bal, hist, user]) => {
                setBalance(bal.credits);
                setHistory(hist);
                setHasGeminiKey(user?.has_gemini_api_key ?? false);
            })
            .catch(() => toast.error('Could not load credits'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const success = searchParams.get('success');
        const canceled = searchParams.get('canceled');
        if (success === '1') {
            toast.success('Payment successful! Your credits have been added.');
            load();
            window.history.replaceState({}, '', '/dashboard/credits');
        }
        if (canceled === '1') {
            toast('Payment canceled.', { icon: 'ℹ️' });
            window.history.replaceState({}, '', '/dashboard/credits');
        }
    }, [searchParams]);

    const handleSaveGeminiKey = async () => {
        const key = geminiKeyInput.trim();
        if (!key) {
            toast.error('Enter your Gemini API key.');
            return;
        }
        if (!key.startsWith('AIza')) {
            toast.error('That doesn\'t look like a valid Gemini key. Keys start with "AIza".');
            return;
        }
        setSavingKey(true);
        try {
            await creditsAPI.setGeminiKey(key);
            setGeminiKeyInput('');
            setHasGeminiKey(true);
            toast.success('Your Gemini API key is saved. AI usage will use your key and will not deduct credits.');
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Failed to save key.');
        } finally {
            setSavingKey(false);
        }
    };

    const handleClearGeminiKey = async () => {
        setSavingKey(true);
        try {
            await creditsAPI.setGeminiKey(null);
            setHasGeminiKey(false);
            setGeminiKeyInput('');
            toast.success('Gemini API key removed. AI usage will use TrainPi credits again.');
        } catch (e: any) {
            toast.error('Failed to clear key.');
        } finally {
            setSavingKey(false);
        }
    };

    const handlePurchase = async (packageId: string) => {
        setPurchasingId(packageId);
        try {
            const { url } = await creditsAPI.createCheckoutSession(packageId);
            window.location.href = url;
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Could not start checkout. Try again.');
            setPurchasingId(null);
        }
    };

    const handleRedeem = () => toast.success('Redeem code coming soon!');

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manage Credits</h1>
                    <p className="text-slate-500">Use credits for AI Career Mentor, career discovery, and roadmap generation. Top up when you run low.</p>
                </div>
            </div>

            {/* Use your own Gemini API key — no Stripe, no payment */}
            <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/80 p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Key className="w-6 h-6 text-violet-600" />
                    <h2 className="text-xl font-bold text-slate-900">Use your own Gemini API key</h2>
                </div>
                <p className="text-slate-700 text-sm mb-4">
                    When your credits run out, you can add your own API key from Google AI Studio. The app will use your key for your AI requests and will not deduct TrainPi credits. You don’t need to create a Stripe account or pay TrainPi — just get a free key from Google and paste it here.
                </p>
                <a
                    href={GEMINI_APKEY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-violet-600 font-medium hover:underline mb-4"
                >
                    Get your free API key at Google AI Studio <ExternalLink className="w-4 h-4" />
                </a>
                {hasGeminiKey === true ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">Your key is set — AI uses your key, no credits deducted</span>
                        <button
                            type="button"
                            onClick={handleClearGeminiKey}
                            disabled={savingKey}
                            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 disabled:opacity-60"
                        >
                            {savingKey ? '…' : 'Remove key'}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="password"
                            placeholder="Paste your Gemini API key (e.g. AIza...)"
                            value={geminiKeyInput}
                            onChange={(e) => setGeminiKeyInput(e.target.value)}
                            className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        />
                        <button
                            type="button"
                            onClick={handleSaveGeminiKey}
                            disabled={savingKey || !geminiKeyInput.trim()}
                            className="px-5 py-2 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-60"
                        >
                            {savingKey ? 'Saving…' : 'Save key'}
                        </button>
                    </div>
                )}
            </div>

            {/* Quota / low credits notice */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
                <strong>Using TrainPi credits?</strong> Each chat message = 1 credit, career discover = 5, roadmap create = 10. Run out? Add your own Gemini key above (free from Google) or buy credits below.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Balance + Packages */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-premium p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                        <p className="text-slate-500 font-medium mb-1">Current Balance</p>
                        <h2 className="text-5xl font-black text-slate-900 mb-6">
                            {loading ? '…' : balance !== null ? balance : '—'} <span className="text-2xl text-slate-400 font-normal">Credits</span>
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">Buy more credits below. They never expire.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg text-slate-900 mb-4">Buy Credits</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PACKAGES.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className={`card-premium p-6 relative ${pkg.popular ? 'ring-2 ring-violet-500' : ''}`}
                                >
                                    {pkg.popular && (
                                        <span className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-violet-600 text-white text-xs font-bold">Popular</span>
                                    )}
                                    <p className="text-2xl font-bold text-slate-900">{pkg.label}</p>
                                    <p className="text-slate-500 text-sm mt-1">{pkg.price}</p>
                                    <button
                                        onClick={() => handlePurchase(pkg.id)}
                                        disabled={purchasingId !== null}
                                        className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {purchasingId === pkg.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="w-4 h-4" />
                                        )}
                                        {purchasingId === pkg.id ? 'Redirecting to checkout…' : 'Pay with Stripe'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-xs text-slate-400">Secure payment via Stripe. You will be redirected to Stripe Checkout to complete payment.</p>
                    </div>
                </div>

                {/* History */}
                <div className="card-premium p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <History className="text-slate-400" />
                        <h3 className="font-bold text-lg text-slate-900">Transaction History</h3>
                    </div>
                    <div className="space-y-4">
                        {loading ? (
                            <p className="text-slate-400 text-sm">Loading…</p>
                        ) : history.length === 0 ? (
                            <p className="text-slate-400 text-sm">No transactions yet.</p>
                        ) : (
                            history.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                    <div>
                                        <p className="font-medium text-slate-800">{tx.description || tx.kind}</p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(tx.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`font-bold ${tx.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {tx.amount >= 0 ? '+' : ''}{tx.amount}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={handleRedeem} className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50">
                    Redeem Code
                </button>
                <Link href="/dashboard" className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}

export default function CreditsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        }>
            <CreditsPageContent />
        </Suspense>
    );
}
