import { create } from 'zustand'

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

