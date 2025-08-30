import { Navigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Building2, Shield, User } from "lucide-react"

import type { ReactNode } from "react"

import { useAuth } from "@/hooks/useAuth"

interface RoleProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ("hr_manager" | "candidate")[]
  requireAuth?: boolean
  fallback?: ReactNode
}

export function RoleProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
  fallback,
}: RoleProtectedRouteProps) {
  const { isSignedIn, isLoading, isHRManager, isCandidate, role } = useAuth()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Check if authentication is required
  if (requireAuth && !isSignedIn) {
    return <Navigate to="/sign-in" />
  }

  // If no specific roles are required, show the content
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>
  }

  // Check if user has the required role
  const hasRequiredRole = allowedRoles.includes(
    role as "hr_manager" | "candidate",
  )

  if (!hasRequiredRole) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>
    }

    // Show default unauthorized message
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 rounded-full p-3">
              <Shield className="text-destructive h-8 w-8" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="text-muted-foreground text-sm">
              <p>Current role: {role || "None"}</p>
              <p>Required roles: {allowedRoles.join(", ")}</p>
            </div>

            <div className="flex justify-center gap-2">
              {isHRManager && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard">
                    <Building2 className="mr-2 h-4 w-4" />
                    HR Dashboard
                  </a>
                </Button>
              )}
              {isCandidate && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Candidate Dashboard
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
