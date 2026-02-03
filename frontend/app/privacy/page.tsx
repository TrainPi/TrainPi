import Link from 'next/link'
import Logo from '@/components/Logo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">Back to Sign up</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>TrainPi respects your privacy. This policy describes how we collect, use, and protect your information.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Information We Collect</h2>
          <p>We collect information you provide when you register (email, name, password) and when you use the service (progress, preferences, and usage data).</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. How We Use It</h2>
          <p>We use your information to provide and improve TrainPi, personalize your experience, and communicate with you about the service.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Data Security</h2>
          <p>We use industry-standard measures to protect your data. Passwords are hashed; we do not store plain-text passwords.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Sharing</h2>
          <p>We do not sell your personal information. We may share data with service providers that help us operate the platform, under strict confidentiality.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Your Rights</h2>
          <p>You may access, correct, or delete your account and data through your account settings or by contacting us.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">6. Changes</h2>
          <p>We may update this policy from time to time. We will notify you of material changes via email or a notice in the service.</p>
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
