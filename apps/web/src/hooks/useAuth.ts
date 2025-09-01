import { useUser } from "@clerk/clerk-react"
import { api } from "@convex/_generated/api"
import { useConvexAuth } from "convex/react"
import { useQuery } from "convex/react"

import type { UserResource } from "@clerk/types"
import type { Doc } from "@convex/_generated/dataModel"

interface AuthReturn {
  isSignedIn: boolean | undefined
  isLoading: boolean
  user: UserResource | null | undefined
  userData: Doc<"users"> | null | undefined
  companyData: Doc<"companies"> | null | undefined
  isHRManager: boolean
  isCandidate: boolean
  role: "hr_manager" | "candidate" | null
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
    isSignedIn && userData?.companyId && userData?.role === "hr_manager"
      ? { id: userData.companyId }
      : "skip",
  )

  // Determine role and permissions
  const role = userData?.role || null
  const isHRManager = role === "hr_manager" && Boolean(userData?.isActive)
  const isCandidate = role === "candidate" && Boolean(userData?.isActive)

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
