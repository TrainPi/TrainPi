'use client';

export default function ScheduleDemo() {
    return (
        <section id="contact" className="py-24 bg-brand-light relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
                    Your Learners Deserve The Best Career Support.
                </h2>
                <p className="text-xl text-slate-600 mb-12">
                    Let’s make it happen—together. Schedule a demo to see how Coach can empower your team and enhance outcomes.
                </p>

                <form className="bg-white rounded-3xl p-8 md:p-12 shadow-xl max-w-3xl mx-auto text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">First name *</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-DEFAULT focus:ring-2 focus:ring-brand-DEFAULT/20 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Last name *</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-DEFAULT focus:ring-2 focus:ring-brand-DEFAULT/20 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                        <input type="email" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-DEFAULT focus:ring-2 focus:ring-brand-DEFAULT/20 outline-none transition-all" />
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Institution Name *</label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-brand-DEFAULT focus:ring-2 focus:ring-brand-DEFAULT/20 outline-none transition-all" />
                    </div>

                    <button type="button" className="w-full py-4 bg-brand-dark text-white rounded-xl font-bold text-lg hover:bg-brand-DEFAULT transition-all shadow-lg shadow-brand/20">
                        Submit
                    </button>
                </form>
            </div>
        </section>
    );
}
