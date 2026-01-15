import Hero from '@/components/sections/Hero';

export default function AboutPage() {
    return (
        <>
            <Hero
                title="About Coach"
                subtitle="Coach is an AI career coach built by CareerVillage.org."
                primaryCtaText="Contact Us"
                primaryCtaLink="/contact"
                variant="light"
            />
            <section className="py-24 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-8">Our Mission</h2>
                    <p className="text-xl text-slate-600 leading-relaxed">
                        To democratize access to career advice and guidance for every student, everywhere.
                    </p>
                </div>
            </section>
        </>
    );
}
