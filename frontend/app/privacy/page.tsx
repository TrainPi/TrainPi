import Link from 'next/link'
import Logo from '@/components/Logo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <div className="flex gap-4">
            <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 font-medium">Terms</Link>
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Sign In</Link>
            <Link href="/" className="text-indigo-600 hover:text-indigo-500 font-medium">Home</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: February 11, 2025</p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>
            TrainPi (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy describes how we collect, use, store, and protect your information when you use our website, applications, and services (the &quot;Service&quot;). By using the Service, you agree to the practices described here.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
          <p><strong>Information you provide</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Account data:</strong> email address, password (stored in hashed form), full name, and optionally profile details such as bio, headline, profile image, location, website, LinkedIn, and GitHub URLs.</li>
            <li><strong>Career and learning data:</strong> interests, skills, career path selections, roadmap progress, resume content, lesson content, quiz answers, and progress data.</li>
            <li><strong>Communications:</strong> messages you send to our AI mentor or support, and any feedback you provide.</li>
          </ul>
          <p><strong>Information we collect automatically</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Usage data:</strong> how you use the Service (e.g., pages visited, features used, time spent).</li>
            <li><strong>Device and log data:</strong> IP address, browser type, device type, and similar technical information.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, operate, and improve the Service (including AI-powered career discovery, roadmaps, lessons, and mentor features).</li>
            <li>Authenticate you and manage your account.</li>
            <li>Process payments and manage credits (when you purchase credits or use paid features).</li>
            <li>Send you service-related communications (e.g., password reset, important updates).</li>
            <li>Personalize your experience and content.</li>
            <li>Analyze usage to improve our product and security.</li>
            <li>Comply with legal obligations and enforce our Terms.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Cookies and Similar Technologies</h2>
          <p>
            We use cookies and similar technologies to keep you signed in (e.g., session and authentication cookies), remember your preferences, and understand how the Service is used. You can control cookies through your browser settings; disabling certain cookies may affect your ability to use the Service.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Third-Party Services and Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Payment processing (Stripe):</strong> to process purchases of credits. Stripe&apos;s use of your data is governed by their privacy policy.</li>
            <li><strong>Authentication (e.g., Google):</strong> if you sign in with Google OAuth, we receive profile information (e.g., email, name, picture) as permitted by your Google account settings.</li>
            <li><strong>AI providers (e.g., Google Gemini):</strong> when you use AI features, we may send relevant content (e.g., your message, career context) to our AI provider to generate responses. If you use your own API key, that key is used directly with the provider according to their terms.</li>
            <li><strong>Infrastructure and analytics:</strong> service providers that host our systems or help us analyze usage, under strict confidentiality and data-processing agreements.</li>
            <li><strong>Legal and safety:</strong> when required by law, or to protect our rights, your safety, or the safety of others.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Data Retention</h2>
          <p>
            We retain your account and usage data for as long as your account is active or as needed to provide the Service and comply with legal obligations. If you delete your account, we will delete or anonymize your personal data in accordance with our retention practices and applicable law.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Data Security</h2>
          <p>
            We use industry-standard measures to protect your data, including encryption in transit (e.g., HTTPS), secure storage, and hashing of passwords. No method of transmission or storage is 100% secure; we cannot guarantee absolute security but we work to protect your information from unauthorized access, use, or disclosure.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">7. Your Rights and Choices</h2>
          <p>Depending on where you live, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Access:</strong> request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> update or correct your data (e.g., via account settings).</li>
            <li><strong>Deletion:</strong> request deletion of your account and personal data.</li>
            <li><strong>Portability:</strong> receive your data in a structured, machine-readable format where applicable.</li>
            <li><strong>Opt-out:</strong> opt out of marketing communications (we do not sell your data).</li>
          </ul>
          <p>
            To exercise these rights, use the account settings in the Service or contact us. We will respond in accordance with applicable law. If you are in the European Economic Area or UK, you may also have the right to lodge a complaint with a supervisory authority.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">8. Children</h2>
          <p>
            The Service is not directed at children under 13 (or the applicable age in your jurisdiction). We do not knowingly collect personal information from children. If you believe we have collected such information, please contact us so we can delete it.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">9. International Transfers</h2>
          <p>
            Your information may be processed in countries other than your own. We take steps to ensure that such processing is subject to appropriate safeguards and complies with applicable data protection laws.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the revised policy on this page and update the &quot;Last updated&quot; date. Material changes may be communicated via email or a notice in the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 mt-8">11. Contact Us</h2>
          <p>
            For questions about this Privacy Policy or our privacy practices, please contact us at the email or address provided on our website or in the Service.
          </p>
        </div>

        <p className="mt-12 text-gray-500 text-sm">
          <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">Terms and Conditions</Link>
          {' · '}
          <Link href="/" className="text-indigo-600 hover:text-indigo-500">Home</Link>
        </p>
      </main>
    </div>
  )
}
