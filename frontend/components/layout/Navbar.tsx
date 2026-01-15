'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, clearAuth } = useAuthStore();

    return (
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            <span className="text-2xl font-display font-bold text-slate-900 tracking-tight">
                                COACH
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/roadmap" className="text-sm font-medium text-slate-600 hover:text-brand-DEFAULT transition-colors">
                            Roadmap
                        </Link>
                        <Link href="/individuals" className="text-sm font-medium text-slate-600 hover:text-brand-DEFAULT transition-colors">
                            For Individuals
                        </Link>
                    </div>

                    {/* CTAs */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900">{user.full_name}</p>
                                    <p className="text-xs text-slate-500">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => clearAuth()}
                                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-slate-900 hover:text-brand-DEFAULT transition-colors">
                                    Signup / Login
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-brand-dark rounded-full hover:bg-brand-DEFAULT transition-colors shadow-lg shadow-brand/20"
                                >
                                    Coach for Institutions
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-slate-600 hover:text-slate-900 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-8 space-y-4">
                            <Link href="/" className="block text-base font-medium text-slate-900" onClick={() => setIsOpen(false)}>
                                For Institutions
                            </Link>
                            <Link href="/individuals" className="block text-base font-medium text-slate-600" onClick={() => setIsOpen(false)}>
                                For Individuals
                            </Link>
                            <Link href="/about" className="block text-base font-medium text-slate-600" onClick={() => setIsOpen(false)}>
                                About
                            </Link>
                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <Link href="/login" className="block text-base font-medium text-slate-900" onClick={() => setIsOpen(false)}>
                                    Signup / Login
                                </Link>
                                <Link
                                    href="/contact"
                                    className="block w-full text-center px-5 py-3 text-base font-medium text-white bg-brand-dark rounded-xl"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Coach for Institutions
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
