import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOGIN = '/login'

// Routes that do NOT require login (exact or prefix)
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
  '/privacy',
  '/terms',
  '/individuals',
]

// Routes that REQUIRE login — everything not in PUBLIC_PATHS is protected
function isPublicPath(path: string): boolean {
  if (path === '/') return true
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

export function middleware(request: NextRequest) {
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

// Run middleware for all protected routes (must include exact paths and nested)
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/learn',
    '/learn/:path*',
    '/career',
    '/roadmap',
    '/roadmap/:path*',
    '/profile',
    '/profile/:path*',
    '/mentor',
    '/mentor/:path*',
    '/exceptions',
    '/exceptions/:path*',
  ],
}

