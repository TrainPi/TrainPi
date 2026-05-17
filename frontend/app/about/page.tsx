import Link from 'next/link'
import Logo from '@/components/Logo'
import { ShieldCheck, Gauge, Target, LibraryBig, Sparkles, ArrowRight } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
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

      {/* Hero */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-white/60 shadow-sm mb-6">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs sm:text-sm font-medium text-slate-600">About TrainPi</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            We don't teach courses. <br />
            We build <span className="gradient-text font-extrabold">operational readiness.</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            TrainPi is an AI-guided platform that closes the gap between knowing security concepts and actually working a SOC shift. Built for the people moving into cybersecurity, IAM, and AI-aware analyst roles.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-violet-600 mb-3">Mission</p>
          <h2 className="text-2xl sm:text-4xl font-bold mb-6 text-slate-900">
            Move learners from "I've watched the video" to "I can run the workflow."
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Generic AI platforms tell you <em>what</em> to learn. TrainPi shows you <em>how the work actually gets done</em> — by analysts, on shift, inside real organizations. Every roadmap, scenario, and mentor response is grounded in operational reality.
          </p>
        </div>
      </section>

      {/* What makes us different */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-violet-600 mb-3">What's different</p>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">Four pillars of operational readiness</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: Gauge,
                title: 'Continuous readiness scoring',
                desc: 'Six operational dimensions — Identity, Phishing, Logs/SIEM, Ticketing, IR, Linux fluency — scored Beginner / Developing / Operational. Updated as you learn.',
              },
              {
                icon: Target,
                title: 'Decision-grade scenarios',
                desc: 'Real analyst situations — MFA fatigue, phishing with credentials entered, alert queue triage — with branching decisions and analyst-grade feedback.',
              },
              {
                icon: LibraryBig,
                title: 'Workflow library',
                desc: 'How analysts actually do the work: phishing investigation, MFA/IAM triage, ticket escalation, incident response. Written for execution, not exams.',
              },
              {
                icon: ShieldCheck,
                title: 'Operational mentor',
                desc: 'Every AI response follows the structure: readiness level → strengths → gaps → next actions → practice scenario. No motivational fluff.',
              },
            ].map((p, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-violet-100 text-violet-700 rounded-2xl flex items-center justify-center mb-5">
                  <p.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">{p.title}</h3>
                <p className="text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-4xl font-bold mb-6">See it in 60 seconds.</h2>
          <p className="text-base sm:text-lg text-slate-300 mb-8">
            Run the MFA Fatigue scenario, get an operational readiness score, and talk to the mentor — all in the live demo.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/demo" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-bold shadow-lg hover:scale-105 transition">
              Walk the demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white font-bold shadow-lg hover:bg-violet-700 transition">
              Sign in to platform
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
