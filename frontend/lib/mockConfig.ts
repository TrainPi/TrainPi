/**
 * Set to true to run the app 100% on mock data — no backend/API calls.
 * When true: auth, dashboard, career, roadmap, lessons, chat, etc. all use local/mock only.
 * Toggle via env: NEXT_PUBLIC_USE_MOCK=false to reconnect to backend.
 */
export const MOCK_ONLY = process.env.NEXT_PUBLIC_USE_MOCK !== 'false'
