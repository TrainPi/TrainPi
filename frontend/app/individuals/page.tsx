import Link from 'next/link'
import Logo from '@/components/Logo'
import { CheckCircle2, ShieldCheck, KeyRound, Monitor, BrainCircuit, ArrowRight, Sparkles, Target } from 'lucide-react'

export default function IndividualsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <Logo />
          <div className="flex items-center gap-6">
            <Link href="/" className="text-slate-600 hover:text-violet-600 font-medium">Home</Link>
            <Link href="/demo" className="text-slate-600 hover:text-violet-600 font-medium">Demo</Link>
            <Link href="/login" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/60 shadow-sm mb-6">
            <Target className="w-4 h-4 text-violet-600" />
            <span className="text-xs sm:text-sm font-medium text-slate-600">For learners</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Become operationally ready <br />
            for your <span className="gradient-text font-extrabold">next security role.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Whether you're transitioning from IT support, completing Security+, or moving from generic IT into a specialized cyber role — TrainPi maps your operational gaps and closes them.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-xl shadow-violet-200 hover:bg-violet-700 transition">
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold shadow-sm hover:border-violet-300 transition">
              Walk the demo
            </Link>
          </div>
        </div>
      </section>

      {/* Tracks */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-violet-600 mb-3">Tracks</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Five operational paths, mapped to real roles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, title: 'Cybersecurity Analyst', desc: 'Enterprise security — endpoint, identity, phishing, vuln management.' },
              { icon: ShieldCheck, title: 'SOC Analyst (Tier 1/2)', desc: 'Shift-based alert triage. SIEM, ticketing, escalation playbooks.' },
              { icon: Monitor, title: 'IT Support → Cyber', desc: 'Lowest-barrier transition. Leverages help-desk + Windows admin.' },
              { icon: KeyRound, title: 'IAM Specialist', desc: 'Identity lifecycle, MFA admin, access reviews, PAM.' },
              { icon: BrainCircuit, title: 'AI Business Analyst', desc: 'Bridge security + AI: workflows, requirements, governance.' },
              { icon: Sparkles, title: 'Custom track', desc: 'Upload your resume — we’ll recommend the closest fit.' },
            ].map((track, i) => (
              <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:shadow-md transition">
                <div className="w-11 h-11 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center mb-4">
                  <track.icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{track.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{track.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can do */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-300 mb-3">What you can do today</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">From "I watched the video" to "I can run the workflow."</h2>
              <ul className="space-y-3">
                {[
                  'Run a live phishing investigation scenario end-to-end',
                  'Triage an MFA fatigue alert under simulated time pressure',
                  'Upload your resume and see an operational gap analysis',
                  'Walk a SOC analyst’s typical shift workflow',
                  'Get role-specific guidance, not motivational fluff',
                  'Track your readiness score across six operational dimensions',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-violet-700/30 to-indigo-900/40 rounded-3xl p-8 border border-white/10">
              <p className="text-xs font-black uppercase tracking-widest text-violet-300 mb-3">Sample scenario</p>
              <h3 className="text-xl font-bold mb-3">MFA Fatigue at 2 AM</h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                A finance user gets 8 MFA prompts at 2 AM and approves the 9th. The IAM platform fires an alert. What do you do first?
              </p>
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">A) Call the user immediately</div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">B) Reset the password</div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">C) Close the ticket</div>
              </div>
              <p className="text-xs text-violet-300 mt-4 font-bold">Run the full 4-step scenario in the platform →</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
