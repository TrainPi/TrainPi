'use client';

import { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/Logo';
import { Menu } from 'lucide-react';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar
                mobileOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="flex-1 flex flex-col min-w-0 w-full md:pl-72 transition-all duration-300">
                {/* Mobile header */}
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
                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
