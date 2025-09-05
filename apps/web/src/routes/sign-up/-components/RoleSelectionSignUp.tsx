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
import { useTranslation } from "react-i18next"

import { signupStore } from "../-store/signup"

import { UserRole } from "@/types/userRole"

interface RoleOption {
  id: UserRole
  title: string
  description: string
  icon: React.ReactNode
  features: string[]
}

export function RoleSelectionSignUp() {
  const router = useRouter()
  const selectedRole = signupStore((state) => state.selectedRole)
  const setSelectedRole = signupStore((state) => state.setSelectedRole)

  const [showSignUp, setShowSignUp] = useState(false)
  const { t } = useTranslation()

  const roleOptions: RoleOption[] = [
    {
      id: UserRole.HR_MANAGER,
      title: t("auth.roleSelection.hrManager.title"),
      description: t("auth.roleSelection.hrManager.description"),
      icon: <Building2 className="size-6" />,
      features: [
        t("auth.roleSelection.hrManager.features.0"),
        t("auth.roleSelection.hrManager.features.1"),
        t("auth.roleSelection.hrManager.features.2"),
        t("auth.roleSelection.hrManager.features.3"),
        t("auth.roleSelection.hrManager.features.4"),
      ],
    },
    {
      id: UserRole.CANDIDATE,
      title: t("auth.roleSelection.candidate.title"),
      description: t("auth.roleSelection.candidate.description"),
      icon: <User className="size-6" />,
      features: [
        t("auth.roleSelection.candidate.features.0"),
        t("auth.roleSelection.candidate.features.1"),
        t("auth.roleSelection.candidate.features.2"),
        t("auth.roleSelection.candidate.features.3"),
        t("auth.roleSelection.candidate.features.4"),
      ],
    },
  ]

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole) {
      setShowSignUp(true)
    }
  }

  if (showSignUp && selectedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Badge variant="secondary" className="mb-2">
              {selectedRole === UserRole.HR_MANAGER
                ? t("auth.roleSelection.hrManager.title")
                : t("auth.roleSelection.candidate.title")}
            </Badge>
            <h2 className="text-2xl font-bold">
              {t("auth.registration.completeRegistration")}
            </h2>
            <p className="text-muted-foreground">
              {selectedRole === UserRole.HR_MANAGER
                ? t("auth.registration.hrManagerSetup")
                : t("auth.registration.candidateSetup")}
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
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">
            {t("auth.roleSelection.joinTitle")}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("auth.roleSelection.joinSubtitle")}
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
            {t("auth.roleSelection.continueAs")}{" "}
            {selectedRole === UserRole.HR_MANAGER
              ? t("auth.roleSelection.hrManager.title")
              : selectedRole === UserRole.CANDIDATE
                ? t("auth.roleSelection.candidate.title")
                : "..."}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {t("auth.roleSelection.alreadyHaveAccount")}{" "}
            <Button
              variant="link"
              className="h-auto p-0 font-normal"
              onClick={() => router.navigate({ to: "/sign-in" })}
            >
              {t("auth.roleSelection.signIn")}
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
