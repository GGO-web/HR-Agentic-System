import { useUser } from "@clerk/clerk-react"
import { api } from "@convex/_generated/api"
import { useConvexAuth } from "convex/react"
import { useQuery } from "convex/react"

import type { UserResource } from "@clerk/types"
import type { Doc } from "@convex/_generated/dataModel"

import { UserRole } from "@/types/userRole"

interface AuthReturn {
  isSignedIn: boolean | undefined
  isLoading: boolean
  user: UserResource | null | undefined
  userData: Doc<"users"> | null | undefined
  companyData: Doc<"companies"> | null | undefined
  isHRManager: boolean
  isCandidate: boolean
  role: UserRole | null
}

export function useAuth(): AuthReturn {
  const { isLoading: isConvexLoading, isAuthenticated: isSignedIn } =
    useConvexAuth()
  const { user } = useUser()

  // Get user data from Convex if authenticated
  const userData = useQuery(
    api.users.getByClerkId,
    isSignedIn && user?.id ? { clerkId: user.id } : "skip",
  )

  // Get company data if user is HR manager
  const companyData = useQuery(
    api.companies.getById,
    isSignedIn && userData?.companyId && userData?.role === UserRole.HR_MANAGER
      ? { id: userData.companyId }
      : "skip",
  )

  // Determine role and permissions
  const role = userData?.role || null
  const isHRManager =
    role === UserRole.HR_MANAGER && Boolean(userData?.isActive)
  const isCandidate = role === UserRole.CANDIDATE && Boolean(userData?.isActive)

  return {
    isSignedIn,
    isLoading: isConvexLoading,
    user,
    userData,
    companyData,
    isHRManager,
    isCandidate,
    role,
  }
}
