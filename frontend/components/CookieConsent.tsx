'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, Check } from 'lucide-react'
import Link from 'next/link'

const COOKIE_CONSENT_KEY = 'trainpi_cookie_consent'

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) {
        // Show after a small delay for better UX
        setTimeout(() => setShow(true), 1000)
      }
    }
  }, [])

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
      setShow(false)
    }
  }

  const handleReject = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected')
      setShow(false)
    }
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Cookie className="w-6 h-6 text-indigo-600" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                We use cookies to enhance your experience
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We use cookies to remember your preferences, keep you logged in, and improve our services. 
                By clicking "Accept All", you consent to our use of cookies. You can learn more in our{' '}
                <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 underline font-medium">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
              <button
                onClick={handleReject}
                className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors whitespace-nowrap"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Check size={16} />
                Accept All
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={handleReject}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:relative md:top-0 md:right-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
