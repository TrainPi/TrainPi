'use client';

import { motion } from 'framer-motion';
import { Users, Briefcase, Globe, ArrowRight } from 'lucide-react';

const FEATURES = [
    {
        icon: Users,
        title: "For Career Services Teams",
        description: "High student-to-advisor ratios mean learners miss out on essential guidance. Coach scales career advising, helping students build skills, explore careers, and land jobs—all while freeing up staff for deeper, high-impact conversations.",
        link: "#",
        color: "bg-blue-500"
    },
    {
        icon: Briefcase,
        title: "For Workforce Development Leaders",
        description: "Job seekers need more than training—they need clear career roadmaps and confidence in the job search. Coach empowers every job seeker with 24/7 career guidance, boosting placement rates and program success.",
        link: "#",
        color: "bg-brand-DEFAULT"
    },
    {
        icon: Globe,
        title: "For Online Learning Platforms",
        description: "Your platform gives learners skills to do the job—but they also need the skills to get the job. Coach seamlessly integrates career guidance into your platform, helping drive retention, completion, and job placement.",
        link: "#",
        color: "bg-purple-500"
    }
];

export default function FeatureGrid() {
    return (
        <section className="py-24 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
                        Institutions Trust Coach To Enhance Advising
                    </h2>
                    <p className="text-xl text-slate-600">
                        Every learner deserves high-quality career support. Coach helps you scale that support despite stretched resources.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {FEATURES.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.2 }}
                            className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 group border border-slate-100"
                        >
                            <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-8 text-white shadow-lg`}>
                                <feature.icon className="w-7 h-7" />
                            </div>

                            <h3 className="text-2xl font-bold text-slate-900 mb-4 font-display">
                                {feature.title}
                            </h3>

                            <p className="text-slate-600 mb-8 leading-relaxed">
                                {feature.description}
                            </p>

                            <a href={feature.link} className="inline-flex items-center text-brand-DEFAULT font-semibold group-hover:gap-2 transition-all">
                                Learn more <ArrowRight className="w-4 h-4 ml-2" />
                            </a>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
