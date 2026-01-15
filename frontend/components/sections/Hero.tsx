'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroProps {
    title: string;
    subtitle: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText?: string;
    secondaryCtaLink?: string;
    variant?: 'light' | 'dark'; // light = white bg, dark = green bg
}

export default function Hero({
    title,
    subtitle,
    primaryCtaText,
    primaryCtaLink,
    secondaryCtaText,
    secondaryCtaLink,
    variant = 'light'
}: HeroProps) {
    const isDark = variant === 'dark';

    return (
        <section className={`relative pt-20 pb-32 overflow-hidden ${isDark ? 'bg-brand-dark text-white' : 'bg-slate-50 text-slate-900'}`}>

            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-[50%] -right-[20%] w-[80%] h-[150%] rounded-full opacity-20 blur-3xl ${isDark ? 'bg-brand-accent' : 'bg-brand-200'}`} />
                <div className={`absolute top-[20%] -left-[10%] w-[40%] h-[80%] rounded-full opacity-20 blur-3xl ${isDark ? 'bg-blue-500' : 'bg-brand-100'}`} />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center z-10">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className={`inline-block py-1 px-3 rounded-full text-sm font-semibold mb-6 ${isDark ? 'bg-white/10 text-brand-accent' : 'bg-brand-100 text-brand-800'}`}>
                        AI-powered career coaching
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-8 max-w-4xl"
                >
                    {title}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={`text-xl md:text-2xl mb-10 max-w-3xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}
                >
                    {subtitle}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link
                        href={primaryCtaLink}
                        className={`px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 ${isDark
                            ? 'bg-brand-accent text-brand-dark hover:bg-white'
                            : 'bg-brand-dark text-white hover:bg-brand-DEFAULT shadow-xl shadow-brand/20'
                            }`}
                    >
                        {primaryCtaText}
                    </Link>

                    {secondaryCtaText && secondaryCtaLink && (
                        <Link
                            href={secondaryCtaLink}
                            className={`px-8 py-4 rounded-full font-semibold text-lg transition-all border ${isDark
                                ? 'border-white/20 text-white hover:bg-white/10'
                                : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300 hover:text-slate-900'
                                }`}
                        >
                            {secondaryCtaText}
                        </Link>
                    )}
                </motion.div>

            </div>
        </section>
    );
}
