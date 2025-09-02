import { useUser } from "@clerk/clerk-react"
import { api } from "@convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { useEffect, useState } from "react"

import { useAuth } from "@/hooks/useAuth"
import { signupStore } from "@/routes/sign-up/-store/signup"

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
      const selectedRole = signupStore.getState().selectedRole
      const setSelectedRole = signupStore.getState().setSelectedRole

      if (!user || isLoading || userData || isCreating) {
        return
      }

      if (!selectedRole) {
        return
      }

      try {
        setIsCreating(true)
        await createUser({
          name: user.username || "",
          email: user.emailAddresses[0]?.emailAddress || "",
          role: selectedRole,
          clerkId: user.id || "",
        })
      } catch (error) {
        console.error("Failed to create user:", error)
      } finally {
        setIsCreating(false)
        setSelectedRole(undefined)
      }
    }

    void handleUserCreation()
  }, [user, userData, isLoading, isCreating, createUser, clerkUserData])

  return <>{children}</>
}
