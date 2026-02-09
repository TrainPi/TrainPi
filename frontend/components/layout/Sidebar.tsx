'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Sparkles,
    Gamepad2,
    BookOpen,
    BrainCircuit,
    Search,
    CreditCard,
    Briefcase,
    LogOut,
    X
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/Logo';
import { useEffect, useState } from 'react';
import { creditsAPI } from '@/lib/api';

interface SidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
    credits?: number | null; // optional: parent can pass updated credits after purchase
}

export default function Sidebar({ mobileOpen = false, onClose, credits: creditsProp }: SidebarProps) {
    const pathname = usePathname();
    const { clearAuth } = useAuthStore();
    const [credits, setCredits] = useState<number | null>(creditsProp ?? null);
    const [creditsLoading, setCreditsLoading] = useState(true);

    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const fetchCredits = () => {
        setCreditsLoading(true);
        creditsAPI.getBalance()
            .then((r) => setCredits(r.credits))
            .catch(() => setCredits(null))
            .finally(() => setCreditsLoading(false));
    };

    useEffect(() => {
        fetchCredits();
    }, [pathname]); // refetch when navigating (e.g. after purchase)

    useEffect(() => {
        if (creditsProp !== undefined && creditsProp !== null) setCredits(creditsProp);
    }, [creditsProp]);

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Job Readiness', icon: Briefcase, href: '/dashboard/job-readiness' },
        { name: 'AI Learning', icon: Sparkles, href: '/dashboard/ai-learning', highlight: true },
        { name: 'Gamified Learning', icon: Gamepad2, href: '/dashboard/gamified' },
        { name: 'Practice Problems', icon: BookOpen, href: '/dashboard/practice' },
        { name: 'Personalized Learning', icon: BrainCircuit, href: '/dashboard/personalized' },
        { name: 'Find Tutor', icon: Search, href: '/dashboard/tutor' },
        { name: 'Manage Credits', icon: CreditCard, href: '/dashboard/credits' },
    ];

    const linkProps = (href: string) => ({
        href,
        onClick: () => onClose?.(),
    });

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`w-72 max-w-[85vw] glass h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-out
                    md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
            {/* Logo Area + Mobile close */}
            <div className="p-4 sm:p-8 pb-4 flex items-center justify-between">
                <Logo />
                <button
                    type="button"
                    onClick={onClose}
                    className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-white/50 hover:text-slate-700"
                    aria-label="Close menu"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-4 sm:px-6 space-y-2">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            {...linkProps(item.href)}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive
                                ? 'shadow-lg shadow-violet-500/20 text-white font-medium'
                                : 'text-slate-500 hover:bg-white/50 hover:text-violet-600'
                                }`}
                        >
                            {/* Active Background - Absolute to ensure gradient covers */}
                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-100 -z-10" />
                            )}

                            <item.icon size={22} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-violet-600'}`} />
                            <span className="relative z-10">{item.name}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Section */}
            <div className="p-6 mt-auto">
                <Link href="/dashboard/credits" {...linkProps('/dashboard/credits')} className="block mb-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-violet-100 relative overflow-hidden group hover:shadow-md hover:border-violet-200 transition-all">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-violet-400/10 rounded-full blur-xl -mr-6 -mt-6" aria-hidden />
                        <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1.5">Credits Available</p>
                        <div className="flex items-baseline gap-1.5">
                            {creditsLoading ? (
                                <span className="text-2xl font-bold text-slate-300">…</span>
                            ) : (
                                <span className="text-3xl font-black text-violet-600">
                                    {credits !== null && credits !== undefined ? credits : '0'}
                                </span>
                            )}
                            <span className="text-sm text-slate-500">credits</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">Tap to manage or buy</p>
                    </div>
                </Link>

                <button
                    type="button"
                    onClick={() => { onClose?.(); clearAuth(); }}
                    className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all w-full font-medium"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
        </>
    );
}
