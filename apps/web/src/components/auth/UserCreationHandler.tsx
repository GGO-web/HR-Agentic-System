import { useUser } from "@clerk/clerk-react"
import { api } from "@convex/_generated/api"
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
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
