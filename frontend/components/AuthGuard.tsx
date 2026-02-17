'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

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

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/_next') || pathname.startsWith('/api')) return
    if (isPublicPath(pathname)) return
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [pathname, isAuthenticated, router])

  return <>{children}</>
}
