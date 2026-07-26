'use client'

import { useState } from 'react'
import { Key, X, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { saveAnyApiKey } from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Props {
  onClose: () => void
}

function detectProvider(key: string): { label: string; docsUrl: string } | null {
  if (key.startsWith('AIza')) return { label: 'Gemini (Google AI Studio)', docsUrl: 'https://aistudio.google.com/apikey' }
  return null
}

export default function CreditsExpiredModal({ onClose }: Props) {
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedProvider, setSavedProvider] = useState('')

  const provider = key.trim() ? detectProvider(key.trim()) : null

  const handleSave = async () => {
    const k = key.trim()
    if (!k) { toast.error('Paste your API key first.'); return }
    if (!provider) {
      toast.error('Unrecognised key. Gemini keys start with AIza')
      return
    }
    setSaving(true)
    try {
      const res = await saveAnyApiKey(k)
      setSavedProvider(res.provider)
      setSaved(true)
      toast.success(`${res.provider} key saved — AI will use your key going forward.`)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save key.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-3xl mb-2">💳</div>
              <h2 className="text-2xl font-black">Credits Expired</h2>
              <p className="text-rose-100 text-sm mt-1">Add your own API key to keep learning for free.</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white p-1">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {saved ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="text-xl font-black text-slate-900">{savedProvider} Key Saved!</h3>
              <p className="text-slate-500 mt-2 text-sm">All AI features will now use your {savedProvider} key. No credits deducted.</p>
              <button onClick={onClose} className="mt-6 px-8 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">
                Continue Learning
              </button>
            </div>
          ) : (
            <>
              <p className="text-slate-600 text-sm">
                You&apos;ve used all your free credits. Add your own free Gemini API key to keep learning at no cost.
              </p>

              {/* Provider links */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { name: 'Gemini', prefix: 'AIza...', url: 'https://aistudio.google.com/apikey', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                ].map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium ${p.color} hover:opacity-80 transition`}
                  >
                    <span>{p.name} <span className="opacity-60 font-normal">({p.prefix})</span></span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>

              {/* Key input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Paste your API key
                  {provider && <span className="ml-2 text-emerald-600 font-normal">✓ {provider.label} detected</span>}
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="AIza..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 outline-none text-sm"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving || !key.trim()}
                    className="px-5 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                    Save
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">Or buy TrainPi credits instead</span>
                <Link
                  href="/dashboard/credits"
                  onClick={onClose}
                  className="text-xs font-bold text-violet-600 hover:underline"
                >
                  Buy Credits →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
