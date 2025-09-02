import { createFileRoute } from "@tanstack/react-router"

import { RoleSelectionSignUp } from "@/routes/sign-up/-components/RoleSelectionSignUp"

export const Route = createFileRoute("/sign-up/")({
  component: SignUpPage,
})

function SignUpPage() {
  return <RoleSelectionSignUp />
}
