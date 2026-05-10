'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    Map,
    Briefcase,
    CreditCard,
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
    credits?: number | null;
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

    useEffect(() => {
        creditsAPI.getBalance()
            .then((r) => setCredits(r.credits))
            .catch(() => setCredits(null))
            .finally(() => setCreditsLoading(false));
    }, []);

    useEffect(() => {
        if (creditsProp !== undefined && creditsProp !== null) setCredits(creditsProp);
    }, [creditsProp]);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Learn', icon: GraduationCap, href: '/catalog' },
        { name: 'My Courses', icon: BookOpen, href: '/courses' },
        { name: 'My Roadmap', icon: Map, href: '/roadmap' },
        { name: 'Job Readiness', icon: Briefcase, href: '/dashboard/job-readiness' },
    ];

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <div
                className={`w-64 max-w-[85vw] glass h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-out
                    md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Logo */}
                <div className="p-6 pb-4 flex items-center justify-between">
                    <Logo />
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-white/50"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose?.()}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                                    active
                                        ? 'shadow-lg shadow-violet-500/20 text-white font-bold'
                                        : 'text-slate-500 hover:bg-white/50 hover:text-violet-600 font-medium'
                                }`}
                            >
                                {active && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 -z-10" />
                                )}
                                <item.icon size={18} className={active ? 'text-white' : 'text-slate-400 group-hover:text-violet-600'} />
                                <span className="text-sm">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="p-4 space-y-3">
                    <Link href="/dashboard/credits" onClick={() => onClose?.()} className="block">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-violet-100 hover:shadow-md hover:border-violet-200 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-violet-400/10 rounded-full blur-xl -mr-4 -mt-4" aria-hidden />
                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-wider mb-1">Credits</p>
                            <div className="flex items-baseline gap-1">
                                {creditsLoading ? (
                                    <span className="text-xl font-bold text-slate-300">…</span>
                                ) : (
                                    <span className="text-2xl font-black text-violet-600">
                                        {credits ?? 0}
                                    </span>
                                )}
                                <span className="text-xs text-slate-500">available</span>
                            </div>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={() => { onClose?.(); clearAuth(); }}
                        className="flex items-center gap-3 px-4 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all w-full font-medium text-sm"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
}
