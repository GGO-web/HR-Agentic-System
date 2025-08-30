import { SignOutButton, useAuth as useClerkAuth } from "@clerk/clerk-react"
import { Link, useRouter } from "@tanstack/react-router"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { User, Building2 } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const { isSignedIn, isHRManager, role } = useAuth()
  const { signOut } = useClerkAuth()
  const router = useRouter()

  return (
    <header className="flex justify-between gap-2 bg-white p-4 text-black shadow-sm">
      <nav className="flex flex-row items-center">
        <div className="px-2 font-bold">
          <Link to={router.routesByPath["/"].fullPath}>HR Agentic System</Link>
        </div>
        {isSignedIn && (
          <div className="px-2">
            <Link to={router.routesByPath["/dashboard"].fullPath}>
              Dashboard
            </Link>
          </div>
        )}
      </nav>

      <div className="flex items-center gap-4">
        {isSignedIn && role && (
          <div className="flex items-center gap-2">
            {isHRManager ? (
              <Building2 className="h-4 w-4 text-blue-600" />
            ) : (
              <User className="h-4 w-4 text-green-600" />
            )}
            <Badge variant="secondary" className="h-8 text-xs">
              {role === "hr_manager" ? "HR Manager" : "Candidate"}
            </Badge>
          </div>
        )}

        {isSignedIn ? (
          <SignOutButton>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </SignOutButton>
        ) : (
          <div className="flex gap-2">
            <Link to={router.routesByPath["/sign-in"].fullPath}>
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to={router.routesByPath["/sign-up"].fullPath}>
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
