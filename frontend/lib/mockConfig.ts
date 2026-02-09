/**
 * Set to true to run the app 100% on mock data — no backend/API calls.
 * In production we always use the real API (no mock). In dev, set NEXT_PUBLIC_USE_MOCK=false to use backend.
 */
export const MOCK_ONLY =
  process.env.NODE_ENV === 'production'
    ? false
    : process.env.NEXT_PUBLIC_USE_MOCK !== 'false'
