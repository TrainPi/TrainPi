'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/Logo';
import { Menu, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isAuthenticated) {
            const next = pathname && pathname !== '/' ? pathname : '/dashboard';
            router.replace(`/login?next=${encodeURIComponent(next)}`);
        }
    }, [isAuthenticated, pathname, router]);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar
                mobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0 w-full md:pl-64 transition-all duration-300">
                <header className="md:hidden sticky top-0 z-30 glass border-b border-white/40 flex items-center justify-between px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl text-slate-600 hover:bg-white/50 hover:text-slate-900"
                        aria-label="Open menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Logo />
                    <div className="w-10" aria-hidden />
                </header>

                <header className="hidden md:flex sticky top-0 z-30 glass border-b border-slate-200/50 px-8 py-4 items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Workforce Readiness</span>
                        </div>
                    </div>
                    <div />
                </header>
                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
