import { createFileRoute } from "@tanstack/react-router"

import { RoleSelectionSignUp } from "@/components/auth/RoleSelectionSignUp"

export const Route = createFileRoute("/sign-up/")({
  component: SignUpPage,
})

function SignUpPage() {
  return <RoleSelectionSignUp />
}
