import { SignUp } from "@clerk/clerk-react"
import { useRouter } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { User, Building2, CheckCircle } from "lucide-react"
import { useState } from "react"

type Role = "hr_manager" | "candidate"

interface RoleOption {
  id: Role
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
}

const roleOptions: RoleOption[] = [
  {
    id: "hr_manager",
    title: "HR Manager",
    description:
      "Create job descriptions, manage interviews, and review candidate responses",
    icon: <Building2 className="size-6" />,
    features: [
      "Create and manage job descriptions",
      "Generate AI-powered interview questions",
      "Schedule and monitor interviews",
      "Review candidate responses and analytics",
      "Manage company profile and settings",
    ],
  },
  {
    id: "candidate",
    title: "Candidate",
    description: "Take audio-based interviews and track your progress",
    icon: <User className="size-6" />,
    features: [
      "Browse available job opportunities",
      "Take audio-based interviews",
      "Track interview progress",
      "Review your responses and feedback",
      "Access interview results",
    ],
  },
]

export function RoleSelectionSignUp() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showSignUp, setShowSignUp] = useState(false)

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole) {
      // Store the selected role in localStorage for the UserCreationHandler
      localStorage.setItem("selectedRole", selectedRole)
      setShowSignUp(true)
    }
  }

  if (showSignUp && selectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Badge variant="secondary" className="mb-2">
              {selectedRole === "hr_manager" ? "HR Manager" : "Candidate"}
            </Badge>
            <h2 className="text-2xl font-bold">Complete Your Registration</h2>
            <p className="text-muted-foreground">
              {selectedRole === "hr_manager"
                ? "Set up your HR manager account to start creating job descriptions and managing interviews."
                : "Create your candidate account to start taking interviews."}
            </p>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg rounded-lg",
              },
            }}
            signInUrl={router.routesByPath["/sign-in"].fullPath}
            afterSignUpUrl="/dashboard"
            redirectUrl="/dashboard"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Join HR Agentic System</h1>
          <p className="text-muted-foreground text-lg">
            Choose your role to get started with AI-powered interviews
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {roleOptions.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === role.id
                  ? "ring-primary border-primary ring-2"
                  : "hover:border-muted-foreground/50"
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary rounded-lg p-2">
                    {role.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                  <CheckCircle
                    className={cn(
                      "text-primary ml-auto size-4 flex-none",
                      selectedRole !== role.id && "invisible",
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={handleContinue}
            disabled={!selectedRole}
            className="px-8"
          >
            Continue as{" "}
            {selectedRole === "hr_manager"
              ? "HR Manager"
              : selectedRole === "candidate"
                ? "Candidate"
                : "..."}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Already have an account?{" "}
            <Button
              variant="link"
              className="h-auto p-0 font-normal"
              onClick={() => router.navigate({ to: "/sign-in" })}
            >
              Sign in
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
