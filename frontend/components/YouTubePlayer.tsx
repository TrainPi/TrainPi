'use client'

import { useEffect, useRef, useState } from 'react'
import { videoAPI } from '@/lib/api'
import { Loader2, Youtube } from 'lucide-react'

interface Props {
  query: string
  title?: string
}

export default function YouTubePlayer({ query, title }: Props) {
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastQuery = useRef<string>('')

  useEffect(() => {
    if (!query || query === lastQuery.current) return
    lastQuery.current = query
    setLoading(true)
    setVideoId(null)
    setError(null)
    videoAPI.search(query)
      .then((res) => setVideoId(res.video_id))
      .catch((err) => {
        const detail = err?.response?.data?.detail || 'Could not load video'
        setError(detail)
      })
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
      {/* Title bar */}
      <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2">
        <Youtube size={16} className="text-red-500 shrink-0" />
        <p className="text-white text-xs font-bold truncate">{title || query}</p>
      </div>

      {/* 16:9 player area */}
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <Loader2 className="animate-spin text-white/40" size={32} />
          </div>
        )}

        {!loading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 text-white/60 text-sm px-6 text-center">
            <Youtube size={28} className="text-red-500/60" />
            <p>{error}</p>
            {error.includes('YOUTUBE_API_KEY') && (
              <p className="text-xs text-slate-500">Add YOUTUBE_API_KEY to backend .env to enable in-portal video.</p>
            )}
          </div>
        )}

        {!loading && videoId && (
          <iframe
            key={videoId}
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=0`}
            title={title || query}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}
