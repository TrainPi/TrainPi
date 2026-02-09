import { create } from 'zustand'

// When true, dashboard is accessible without logging in. Set to false to require login (use with mock API).
const BYPASS_AUTH = false

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
          return {
            user: parsed.user,
            token: parsed.token,
            isAuthenticated: true,
            setAuth: (user, token) => {
              set({ user, token, isAuthenticated: true })
              localStorage.setItem('auth-storage', JSON.stringify({ user, token }))
            },
            clearAuth: () => {
              set({ user: null, token: null, isAuthenticated: false })
              localStorage.removeItem('auth-storage')
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
        }
      },
      clearAuth: () => {
        set({ user: BYPASS_AUTH ? { ...GUEST_USER } : null, token: null, isAuthenticated: BYPASS_AUTH })
        if (typeof window !== 'undefined' && !BYPASS_AUTH) {
          localStorage.removeItem('auth-storage')
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
      }
    },
    clearAuth: () => {
      set({ user: null, token: null, isAuthenticated: false })
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage')
      }
    },
  }
})

