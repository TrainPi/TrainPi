import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-300 py-10 sm:py-16 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 mb-8 sm:mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-display font-bold text-white tracking-tight block mb-6">
                            COACH
                        </span>
                        <p className="text-sm leading-relaxed text-slate-400 mb-6">
                            AI-powered career development for everyone, from students to job-seekers.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                            <a href="#" className="hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                        </div>
                    </div>

                    {/* Coach */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Coach</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Sign in</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Partner</Link></li>
                            <li><Link href="/about" className="hover:text-brand-accent transition-colors">About Coach</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Impact</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">Support</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Safety</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Guidelines for Use</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Help Center</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">FAQ</Link></li>
                        </ul>
                    </div>

                    {/* CareerVillage */}
                    <div>
                        <h3 className="text-white font-semibold mb-6">CareerVillage.org</h3>
                        <ul className="space-y-4 text-sm">
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Home</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Team</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Mission</Link></li>
                            <li><Link href="/" className="hover:text-brand-accent transition-colors">Ask a Question</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 sm:pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 text-center md:text-left">
                    <p>© Copyright 2026. All Rights Reserved.</p>
                    <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6">
                        <Link href="/donate" className="hover:text-white font-medium">Donate</Link>
                        <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white">Terms and Conditions</Link>
                    </div>
                </div>
                <div className="mt-8 text-xs text-slate-600 text-center">
                    Coach is an AI career coach from CareerVillage, a registered 501(c)(3) nonprofit.
                </div>
            </div>
        </footer>
    );
}
