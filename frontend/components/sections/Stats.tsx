'use client';

import { motion } from 'framer-motion';

const STATS = [
    { value: "90%", label: "of learners report improved career readiness" },
    { value: "85%", label: "feel they know what skills they need" },
    { value: "85%", label: "are more motivated to plan their career path" },
];

export default function Stats() {
    return (
        <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
            {/* Decorative circle */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-DEFAULT rounded-full opacity-10 blur-3xl transfrom translate-x-1/2 -translate-y-1/2"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Real Impact, Real Results</h2>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                        Launched in 2024, Coach has been used by more than 65,000 users across 30 partners.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {STATS.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="text-center p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
                        >
                            <div className="text-6xl font-bold text-brand-accent mb-4 font-display">{stat.value}</div>
                            <p className="text-lg text-slate-300">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
