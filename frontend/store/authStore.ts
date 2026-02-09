import { create } from 'zustand'

// When true, dashboard is accessible without logging in. Set to false to require login (use with mock API).
const BYPASS_AUTH = false

const AUTH_COOKIE = 'trainpi_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`
}

const GUEST_USER = {
  id: 0,
  email: 'guest@trainpi.dev',
  full_name: 'Guest',
  bio: null,
  headline: null,
  profile_image: null,
  location: null,
  website: null,
  linkedin_url: null,
  github_url: null,
} as const

interface User {
  id: number
  email: string
  full_name: string | null
  bio?: string | null
  headline?: string | null
  profile_image?: string | null
  location?: string | null
  website?: string | null
  linkedin_url?: string | null
  github_url?: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.user && parsed.token) {
          setAuthCookie(parsed.token)
          return {
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true,
            setAuth: (user, token) => {
              set({ user, token, isAuthenticated: true })
              localStorage.setItem('auth-storage', JSON.stringify({ user, token }))
              setAuthCookie(token)
            },
            clearAuth: () => {
              set({ user: null, token: null, isAuthenticated: false })
              localStorage.removeItem('auth-storage')
              clearAuthCookie()
            },
          }
        }
      } catch (e) {
        // Invalid storage, continue with defaults
      }
    }
  }

  // Bypass: treat as logged-in guest so you can navigate the whole dashboard without login
  if (BYPASS_AUTH) {
    return {
      user: { ...GUEST_USER },
      token: null,
      isAuthenticated: true,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth-storage', JSON.stringify({ user, token }))
          setAuthCookie(token)
        }
      },
      clearAuth: () => {
        set({ user: BYPASS_AUTH ? { ...GUEST_USER } : null, token: null, isAuthenticated: BYPASS_AUTH })
        if (typeof window !== 'undefined' && !BYPASS_AUTH) {
          localStorage.removeItem('auth-storage')
          clearAuthCookie()
        }
      },
    }
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
    setAuth: (user, token) => {
      set({ user, token, isAuthenticated: true })
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-storage', JSON.stringify({ user, token }))
        setAuthCookie(token)
      }
    },
    clearAuth: () => {
      set({ user: null, token: null, isAuthenticated: false })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage')
        clearAuthCookie()
      }
    },
  }
})

