'use client';

import { CreditCard, History } from 'lucide-react';

export default function CreditsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <CreditCard size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Manage Credits</h1>
                    <p className="text-slate-500">View and top up your learning credits.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card-premium p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <p className="text-slate-500 font-medium mb-1">Current Balance</p>
                    <h2 className="text-5xl font-black text-slate-900 mb-6">858 <span className="text-2xl text-slate-400 font-normal">Credits</span></h2>

                    <div className="flex gap-4">
                        <button className="btn-primary flex-1">Buy Credits</button>
                        <button className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50">Redeem Code</button>
                    </div>
                </div>

                <div className="card-premium p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <History className="text-slate-400" />
                        <h3 className="font-bold text-lg text-slate-900">Transaction History</h3>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                <div>
                                    <p className="font-medium text-slate-800">Advanced Python Course</p>
                                    <p className="text-xs text-slate-400">Jan 1{i}, 2026</p>
                                </div>
                                <span className="font-bold text-rose-500">-50</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-slate-800">Monthly Top-up</p>
                                <p className="text-xs text-slate-400">Jan 01, 2026</p>
                            </div>
                            <span className="font-bold text-emerald-500">+500</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
