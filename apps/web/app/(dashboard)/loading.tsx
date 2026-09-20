import { SplashScreen } from '@/app/components/Primitives'

// Top-level dashboard boundary: shows the full-screen splash when navigating
// in from a non-dashboard route (landing, docs, guide, login/signup).
export default function Loading() {
  return <SplashScreen />
}