import { useUser } from "@clerk/clerk-react"
import { api } from "@convex/_generated/api"
import { LoadingSpinner } from "@workspace/ui/components/shared/loading-spinner"
import { useMutation } from "convex/react"
import { useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"

interface UserCreationHandlerProps {
  children: React.ReactNode
}

export function UserCreationHandler({ children }: UserCreationHandlerProps) {
  const { user } = useUser()
  const { userData, isLoading } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

  const createUser = useMutation(api.users.create)

  useEffect(() => {
    const handleUserCreation = async () => {
      if (!user || isLoading || userData || isCreating) {
        return
      }

      // Get role from localStorage (set during role selection)
      const selectedRole = localStorage.getItem("selectedRole") as
        | "hr_manager"
        | "candidate"

      if (!selectedRole) {
        console.warn("No role found in localStorage")
        return
      }

      setIsCreating(true)

      try {
        await createUser({
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.emailAddresses[0]?.emailAddress ||
            "",
          email: user.emailAddresses[0]?.emailAddress || "",
          role: selectedRole,
          clerkId: user.id,
        })

        // Clear the stored role
        localStorage.removeItem("selectedRole")

        // Refresh the page to trigger auth hook update
        void window.location.reload()
      } catch (error) {
        console.error("Failed to create user:", error)
        setIsCreating(false)
      }
    }

    void handleUserCreation()
  }, [user, userData, isLoading, isCreating, createUser])

  // Show loading state while creating user
  if (isCreating) {
    return <LoadingSpinner fullScreen text="Setting up your account..." />
  }

  return <>{children}</>
}
