import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOGIN = '/login'
const IS_DEV = process.env.NODE_ENV !== 'production'

// Only these routes are accessible WITHOUT logging in. Every other path requires login.
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

export function middleware(request: NextRequest) {
  // Local development: don't enforce cookie auth at the edge.
  // We rely on client-side auth state (Zustand/localStorage) while running locally.
  if (IS_DEV) {
    return NextResponse.next()
  }

  const path = request.nextUrl.pathname

  // Static / framework / API — never run auth check
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next()
  }

  // Public routes — allow without login
  if (isPublicPath(path)) {
    return NextResponse.next()
  }

  // All other routes are protected — require valid cookie
  const token = request.cookies.get('trainpi_token')?.value
  if (!token || !token.trim()) {
    const loginUrl = new URL(LOGIN, request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Match all page routes so auth runs on every navigation (exclude Next.js internals and static files)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.png).*)'],
}

