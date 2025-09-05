import { useUser } from "@clerk/clerk-react"
import { useEffect } from "react"

import { useCreateUserMutation } from "./_hooks/useCreateUserMutation"

import { useAuth } from "@/hooks/useAuth"
import { signupStore } from "@/routes/sign-up/-store/signup"

interface UserCreationHandlerProps {
  children: React.ReactNode
}

export function UserCreationHandler({ children }: UserCreationHandlerProps) {
  const { user } = useUser()
  const { userData, isLoading } = useAuth()
  const { mutateAsync: createUser, isPending: isCreating } =
    useCreateUserMutation()

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
        await createUser({
          name: user.username || "",
          email: user.emailAddresses[0]?.emailAddress || "",
          role: selectedRole,
          clerkId: user.id || "",
        })
      } catch (error) {
        console.error("Failed to create user:", error)
      } finally {
        setSelectedRole(undefined)
      }
    }

    void handleUserCreation()
  }, [user, userData, isLoading, isCreating, createUser])

  return <>{children}</>
}
