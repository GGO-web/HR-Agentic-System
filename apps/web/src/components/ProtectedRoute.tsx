import { Navigate } from "@tanstack/react-router"
import { type ReactNode } from "react"

import { useAuth } from "../hooks/useAuth"

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireHRManager?: boolean
  requireCandidate?: boolean
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireHRManager = false,
  requireCandidate = false,
}: ProtectedRouteProps) {
  const { isSignedIn, isLoading, isHRManager, isCandidate } = useAuth()

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>
  }

  // Check authentication
  if (requireAuth && !isSignedIn) {
    return <Navigate to="/sign-in" />
  }

  // Check HR manager role
  if (requireHRManager && !isHRManager) {
    return <Navigate to="/unauthorized" />
  }

  // Check candidate role
  if (requireCandidate && !isCandidate) {
    return <Navigate to="/unauthorized" />
  }

  return <>{children}</>
}
