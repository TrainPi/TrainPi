/**
 * Demo mode: the entire app runs on mock data — no backend calls.
 * Controlled by NEXT_PUBLIC_USE_MOCK. Set to 'false' in the environment
 * to use the real backend (requires NEXT_PUBLIC_API_URL + a running backend).
 */
export const MOCK_ONLY: boolean = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'
