'use client';

import { motion } from 'framer-motion';

const PARTNERS = [
    "American Career College", "Athens State University", "Big Brothers Big Sisters",
    "Boys and Girls Clubs", "Cal State East Bay", "Forsyth Tech", "Generation.org",
    "Inacap", "LA Tech", "Merit America", "Tallo", "Technovation", "University of Florida"
];

export default function LogoTicker() {
    return (
        <section className="py-10 bg-white border-y border-slate-100 overflow-hidden">
            <div className="flex">
                <motion.div
                    className="flex gap-16 px-8 items-center whitespace-nowrap"
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 30,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                >
                    {/* Repeat list twice for seamless loop */}
                    {[...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, idx) => (
                        <div key={idx} className="flex items-center gap-2 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer">
                            {/* Placeholder text for logo as we don't have SVGs */}
                            <span className="text-xl font-bold font-display text-slate-400 hover:text-brand-dark">
                                {partner}
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
