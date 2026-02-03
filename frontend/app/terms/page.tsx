import Link from 'next/link'
import Logo from '@/components/Logo'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <Link href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">Back to Sign up</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
        <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
          <p>Welcome to TrainPi. By using our service you agree to these terms.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">1. Use of Service</h2>
          <p>You may use TrainPi for personal learning and career development. You must provide accurate information and keep your account secure.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">2. Acceptable Use</h2>
          <p>You may not misuse the service, attempt to gain unauthorized access, or use it for any illegal purpose.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">3. Intellectual Property</h2>
          <p>TrainPi and its content are protected by intellectual property laws. You may not copy or redistribute our materials without permission.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">4. Limitation of Liability</h2>
          <p>TrainPi is provided &quot;as is.&quot; We are not liable for any indirect or consequential damages arising from your use of the service.</p>
          <h2 className="text-xl font-semibold text-gray-900 mt-8">5. Changes</h2>
          <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance.</p>
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
