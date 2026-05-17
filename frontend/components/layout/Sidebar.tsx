'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    Map,
    Briefcase,
    FileBarChart2,
    GitCompare,
    BarChart3,
    Route,
    Shield,
    LogOut,
    X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/Logo';
import { useEffect } from 'react';

interface SidebarProps {
    mobileOpen?: boolean;
    onClose?: () => void;
}

const PRIMARY_NAV = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Learn', icon: GraduationCap, href: '/catalog' },
    { name: 'My Courses', icon: BookOpen, href: '/courses' },
    { name: 'My Roadmap', icon: Map, href: '/roadmap' },
    { name: 'Job Readiness', icon: Briefcase, href: '/dashboard/job-readiness' },
];

const WORKFORCE_TOOLS_NAV = [
    { name: 'Operational Context', icon: FileBarChart2, href: '/workforce/operational-context' },
    { name: 'Analysis Comparison', icon: GitCompare, href: '/workforce/analysis-comparison' },
    { name: 'Results & Insights', icon: BarChart3, href: '/workforce/results-insights' },
    { name: 'Roadmap & Pathway', icon: Route, href: '/workforce/roadmap-pathway' },
];

export default function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { clearAuth } = useAuthStore();

    useEffect(() => {
        if (mobileOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const isActive = (href: string) => {
        // Special case: Step 1 (/workforce/profile) keeps "Dashboard" highlighted
        // because it's reached from the Dashboard entry point.
        if (href === '/dashboard') {
            return pathname === '/dashboard' || pathname === '/workforce/profile'
        }
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity md:hidden ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={`w-64 max-w-[85vw] bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 ease-out
                    md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
            >
                {/* Header / brand */}
                <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <div className="leading-tight">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Workforce Readiness</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
                    <NavGroup items={PRIMARY_NAV} isActive={isActive} onClose={onClose} />
                    <div>
                        <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Workforce Tools</p>
                        <NavGroup items={WORKFORCE_TOOLS_NAV} isActive={isActive} onClose={onClose} />
                    </div>
                </nav>

                {/* Bottom: data security badge */}
                <div className="p-4 space-y-3 border-t border-slate-100">
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-3 flex items-center gap-3 border border-indigo-100">
                        <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                            <Shield className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-black text-slate-900">Your Data is Secure</p>
                            <p className="text-[10px] text-slate-500 leading-tight">All uploads and information are encrypted and never shared with third parties.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => { onClose?.(); clearAuth(); }}
                        className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all w-full font-medium text-xs"
                    >
                        <LogOut size={14} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

function NavGroup({
    items,
    isActive,
    onClose,
}: {
    items: { name: string; icon: any; href: string }[];
    isActive: (href: string) => boolean;
    onClose?: () => void;
}) {
    return (
        <div className="space-y-0.5">
            {items.map((item) => {
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onClose?.()}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                            active
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-200 font-bold'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`}
                    >
                        <item.icon size={17} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'} />
                        <span className="text-sm">{item.name}</span>
                    </Link>
                );
            })}
        </div>
    );
}
