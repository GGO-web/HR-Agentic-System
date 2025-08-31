import { Navigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner"
import { Building2, Shield, User } from "lucide-react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner fullScreen text={t("common.loading")} />
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
              <Shield className="text-destructive size-8" />
            </div>
            <CardTitle className="text-xl">
              {t("protectedRoute.accessDenied")}
            </CardTitle>
            <CardDescription>
              {t("protectedRoute.noPermission")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="text-muted-foreground text-sm">
              <p>
                {t("protectedRoute.currentRole")}:{" "}
                {role || t("protectedRoute.none")}
              </p>
              <p>
                {t("protectedRoute.requiredRoles")}: {allowedRoles.join(", ")}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {isHRManager && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard">
                    <Building2 className="mr-2 h-4 w-4" />
                    {t("protectedRoute.hrDashboard")}
                  </a>
                </Button>
              )}
              {isCandidate && (
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    {t("protectedRoute.candidateDashboard")}
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
