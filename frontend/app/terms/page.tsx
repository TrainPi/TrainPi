import Link from 'next/link'
import Logo from '@/components/Logo'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 font-medium">Privacy</Link>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Sign In</Link>
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">Home</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: February 11, 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>
            Welcome to TrainPi (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By accessing or using our website, applications, or services (collectively, the &quot;Service&quot;), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Acceptance of Terms</h2>
          <p>
            By creating an account, logging in, or using TrainPi in any way, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Account Registration and Security</h2>
          <p>
            You must provide accurate, current, and complete information when registering. You are responsible for safeguarding your password and for all activity under your account. You must notify us immediately of any unauthorized use. We are not liable for any loss or damage arising from your failure to protect your account.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Use of the Service</h2>
          <p>
            TrainPi provides AI-powered career discovery, learning paths, mini-lessons, resume tools, and an AI mentor. You may use the Service only for lawful, personal learning and career development. You must not use the Service in any way that violates applicable laws, infringes others&apos; rights, or could harm the Service or other users.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. AI Features and Content</h2>
          <p>
            Our Service uses artificial intelligence (including third-party AI providers such as Google) to generate career recommendations, roadmaps, lesson content, and mentor responses. AI-generated content is for informational and educational purposes only. We do not guarantee the accuracy, completeness, or suitability of AI output. You are responsible for evaluating and using any AI-generated content at your own discretion.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Credits and Payments</h2>
          <p>
            Certain features consume &quot;credits&quot; from your account. New users may receive free credits. Additional credits may be purchased through our payment processor (Stripe). All purchases are subject to our pricing at the time of purchase. Refunds are handled in accordance with our refund policy and applicable law. If you provide your own API key (e.g., for Gemini), usage through that key may not deduct credits; you are responsible for compliance with that provider&apos;s terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the Service for any illegal purpose or in violation of any laws.</li>
            <li>Attempt to gain unauthorized access to our systems, other accounts, or third-party services.</li>
            <li>Scrape, reverse-engineer, or automate access to the Service in an unauthorized manner.</li>
            <li>Upload or transmit malware, spam, or content that is harmful, abusive, or infringing.</li>
            <li>Resell or redistribute the Service or content without our written permission.</li>
          </ul>
          <p>We may suspend or terminate your account if we believe you have violated these terms.</p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">7. Intellectual Property</h2>
          <p>
            TrainPi and its content (including but not limited to software, design, text, graphics, and logos) are owned by us or our licensors and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works from our materials without our prior written consent. Content you create or upload remains yours; you grant us a license to use it as needed to operate and improve the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">8. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS. WE DISCLAIM ALL WARRANTIES TO THE FULLEST EXTENT PERMITTED BY LAW.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRAINPI AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED U.S. DOLLARS (USD $100), WHICHEVER IS GREATER.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">10. Termination</h2>
          <p>
            You may close your account at any time. We may suspend or terminate your access to the Service at any time, with or without cause or notice. Upon termination, your right to use the Service ceases immediately. Sections that by their nature should survive (including intellectual property, disclaimers, limitation of liability, and governing law) will survive termination.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">11. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. We will post the revised Terms on this page and update the &quot;Last updated&quot; date. Material changes may be communicated via email or a notice in the Service. Your continued use of the Service after changes constitutes acceptance of the revised Terms. If you do not agree, you must stop using the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">12. Governing Law and Disputes</h2>
          <p>
            These Terms are governed by the laws of the United States and the state in which we operate, without regard to conflict of law principles. Any dispute arising from these Terms or the Service shall be resolved in the courts of that jurisdiction, and you consent to personal jurisdiction there.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">13. Contact</h2>
          <p>
            For questions about these Terms and Conditions, please contact us at the email or address provided on our website or in the Service.
          </p>
        </div>

        <p className="mt-12 text-gray-500 text-sm">
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">Privacy Policy</Link>
          {' · '}
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">Home</Link>
        </p>
      </main>
    </div>
  )
}
