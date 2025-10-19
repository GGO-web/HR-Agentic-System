import { Navigate, useRouter } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { type ReactNode } from "react";

import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireHRManager?: boolean;
  requireCandidate?: boolean;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireHRManager = false,
  requireCandidate = false,
}: ProtectedRouteProps) {
  const { isSignedIn, isLoading, isHRManager, isCandidate } = useAuth();
  const router = useRouter();

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  // Check authentication
  if (requireAuth && !isSignedIn) {
    return <Navigate to={router.routesByPath["/sign-in"].fullPath} />;
  }

  // Check HR manager role
  if (requireHRManager && !isHRManager) {
    return <UnauthorizedMessage requiredRole="HR Manager" />;
  }

  // Check candidate role
  if (requireCandidate && !isCandidate) {
    return <UnauthorizedMessage requiredRole="Candidate" />;
  }

  return <>{children}</>;
}

interface UnauthorizedMessageProps {
  requiredRole: string;
}

function UnauthorizedMessage({ requiredRole }: UnauthorizedMessageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription className="text-gray-600">
            This page requires {requiredRole} permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your account doesn't have the required permissions to access this
              page. Please contact your administrator if you believe this is an
              error.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </a>
            </Button>

            <Button variant="outline" asChild className="w-full">
              <a href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
