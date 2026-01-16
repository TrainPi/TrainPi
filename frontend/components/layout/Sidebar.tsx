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
    Settings,
    LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/Logo';

export default function Sidebar() {
    const pathname = usePathname();
    const { user, clearAuth } = useAuthStore();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'AI Learning', icon: Sparkles, href: '/dashboard/ai-learning', highlight: true },
        { name: 'Gamified Learning', icon: Gamepad2, href: '/dashboard/gamified' },
        { name: 'Practice Problems', icon: BookOpen, href: '/dashboard/practice' },
        { name: 'Personalized Learning', icon: BrainCircuit, href: '/dashboard/personalized' },
        { name: 'Find Tutor', icon: Search, href: '/dashboard/tutor' },
        { name: 'Manage Credits', icon: CreditCard, href: '/dashboard/credits' },
    ];

    return (
        <div className="w-72 glass h-screen fixed left-0 top-0 flex flex-col z-50 transition-all duration-300">
            {/* Logo Area */}
            <div className="p-8 pb-4">
                <Logo />
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-4 px-6 space-y-2">
                <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
                <div className="glass-panel rounded-2xl p-5 mb-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl -mr-8 -mt-8 transition-all group-hover:bg-violet-500/20"></div>
                    <p className="text-xs text-violet-800 font-bold mb-1 uppercase tracking-wider">Credits Available</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">858</p>
                        <span className="text-xs text-slate-400">/ 1000</span>
                    </div>
                </div>

                <button
                    onClick={() => clearAuth()}
                    className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all w-full font-medium"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
}
