import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOGIN = '/login'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public routes — allow without login
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/demo', '/about', '/contact', '/privacy', '/terms', '/individuals']
  if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Static and API routes
  if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
    return NextResponse.next()
  }

  // Protected routes — require login
  const token = request.cookies.get('trainpi_token')?.value
  if (!token || !token.trim()) {
    const loginUrl = new URL(LOGIN, request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
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

