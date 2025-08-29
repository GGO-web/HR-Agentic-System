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

  // Check if user has a company (is HR manager)
  const companyData = useQuery(
    api.companies.getByClerkId,
    isSignedIn && user?.id ? { clerkId: user.id } : "skip",
  )

  const isHRManager = Boolean(companyData)
  const isCandidate = Boolean(isSignedIn && !isHRManager)

  return {
    isSignedIn,
    isLoading: isConvexLoading,
    user,
    userData,
    companyData,
    isHRManager,
    isCandidate,
  }
}
