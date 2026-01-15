'use client';

import { Quote } from 'lucide-react';

const TESTIMONIALS = [
    {
        text: "Coach is an invaluable AI-powered resource that will surely help many individuals choose optimal career paths and land desired jobs...we were super impressed by the accessibility and potential to provide transformative impacts at scale.",
        author: "Nicholas Olmo",
        role: "Director of Digital Partnerships, Opportunity@Work"
    },
    {
        text: "What makes Coach particularly valuable is how it complements our existing tools – helping users not just identify opportunities but also prepare effectively for them through tailored advice.",
        author: "Allison Danielsen",
        role: "CEO, Tallo"
    },
    {
        text: "Coach is a game changer for students and young adults who do not have access to the career development guidance they need.",
        author: "Betsy Jewell",
        role: "Certified Career Coach"
    }
];

export default function Testimonials() {
    return (
        <section className="py-24 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl font-display font-bold mb-16">What Industry Leaders Are Saying</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {TESTIMONIALS.map((t, i) => (
                        <div key={i} className="bg-slate-50 p-10 rounded-[2rem] relative">
                            <Quote className="w-10 h-10 text-brand-dark/10 absolute top-8 right-8" />
                            <p className="text-lg text-slate-700 italic mb-8 relative z-10 leading-relaxed">
                                "{t.text}"
                            </p>
                            <div>
                                <div className="font-bold text-slate-900">{t.author}</div>
                                <div className="text-sm text-slate-500">{t.role}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
