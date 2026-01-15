import Hero from '@/components/sections/Hero';
import { CheckCircle2, Zap, Layout, GraduationCap, Unlock } from 'lucide-react';

export default function IndividualsPage() {
    return (
        <>
            <Hero
                title="Your Career Starts Here"
                subtitle="Coach is your free, always-on AI career coach — designed to give college students personalized career counseling, help you plan next steps, and prepare for life after graduation."
                primaryCtaText="Sign up free"
                primaryCtaLink="/login"
                variant="dark"
            />

            {/* What can Coach do? */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-display font-bold text-center mb-16 text-slate-900">What can Coach do?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: GraduationCap, title: "Personalized guidance", desc: "Get career counseling tailored to your major, experience, and goals." },
                            { icon: Layout, title: "Stronger resumes", desc: "Turn a generic resume into one that gets callbacks finding the right keywords." },
                            { icon: Zap, title: "Ace the job search", desc: "Strategies for finding a job in a new city or country." },
                            { icon: CheckCircle2, title: "Practice for interviews", desc: "Specific phrases that help you stand out in internship interviews." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all">
                                <div className="w-12 h-12 bg-brand-100 text-brand-dark rounded-xl flex items-center justify-center mb-6">
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Real Insights */}
            <section className="py-24 bg-brand-dark text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-display font-bold mb-8">Real insights you’ll discover</h2>
                            <ul className="space-y-4">
                                {[
                                    "What career paths your major unlocks",
                                    "How to pitch your campus job experience",
                                    "The best certifications to pursue",
                                    "How to explain a GPA dip",
                                    "Top 3 transferable skills employers want",
                                    "Email templates for networking"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-lg text-brand-100">
                                        <Unlock className="w-6 h-6 flex-shrink-0 text-brand-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            {/* Abstract Visual Representation */}
                            <div className="aspet-square rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-8 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent opacity-20 blur-[100px] rounded-full point-events-none"></div>
                                <div className="space-y-4 relative z-10">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 animate-pulse-slow" style={{ animationDelay: `${i * 1}s` }}>
                                            <div className="h-4 w-3/4 bg-white/20 rounded mb-2"></div>
                                            <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
