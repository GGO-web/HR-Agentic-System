import { Navigate, useRouter } from "@tanstack/react-router"
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
  const router = useRouter()

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>
  }

  // Check authentication
  if (requireAuth && !isSignedIn) {
    return <Navigate to={router.routesByPath["/sign-in"].fullPath} />
  }

  // Check HR manager role
  if (requireHRManager && !isHRManager) {
    return <Navigate to={router.routesByPath["/unauthorized"].fullPath} />
  }

  // Check candidate role
  if (requireCandidate && !isCandidate) {
    return <Navigate to={router.routesByPath["/unauthorized"].fullPath} />
  }

  return <>{children}</>
}
