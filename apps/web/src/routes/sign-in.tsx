import { SignIn } from "@clerk/clerk-react"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg rounded-lg",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
