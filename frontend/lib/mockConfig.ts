/**
 * Demo mode: the entire app runs on mock data — no backend calls.
 * Forced ON for the demo build so deployment works without backend/env keys.
 *
 * If you ever need to wire the live backend back in, set NEXT_PUBLIC_USE_MOCK=false
 * in the environment AND change the default below to `false`.
 */
const FORCE_MOCK_FOR_DEMO = true

export const MOCK_ONLY: boolean = FORCE_MOCK_FOR_DEMO
  ? true
  : process.env.NEXT_PUBLIC_USE_MOCK !== 'false'
