'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/demo',
  '/about',
  '/contact',
  '/donate',
  '/privacy',
  '/terms',
  '/individuals',
]

function isPublicPath(path: string): boolean {
  if (path === '/') return true
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false
  const match = document.cookie.match(/trainpi_token=([^;]*)/)
  const token = match ? decodeURIComponent(match[1].trim()) : ''
  return token.length > 0
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/_next') || pathname.startsWith('/api')) return
    if (isPublicPath(pathname)) return
    if (!hasAuthCookie()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [pathname, router])

  return <>{children}</>
}
