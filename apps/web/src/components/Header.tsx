import { SignOutButton, useAuth as useClerkAuth } from "@clerk/clerk-react"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

import { useAuth } from "@/hooks/useAuth"

export default function Header() {
  const { isSignedIn } = useAuth()
  const { signOut } = useClerkAuth()

  return (
    <header className="flex justify-between gap-2 bg-white p-4 text-black shadow-sm">
      <nav className="flex flex-row items-center">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>
        {isSignedIn && (
          <div className="px-2">
            <Link to="/dashboard">Dashboard</Link>
          </div>
        )}
      </nav>

      <div className="flex items-center">
        {isSignedIn ? (
          <SignOutButton>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              Sign Out
            </Button>
          </SignOutButton>
        ) : (
          <div className="flex gap-2">
            <Link to="/sign-in">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/sign-up">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
