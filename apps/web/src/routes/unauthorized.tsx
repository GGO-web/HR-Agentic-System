import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedPage,
})

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Unauthorized</h1>

      <p className="mt-4 text-lg">
        You don't have permission to access this page.
      </p>

      <Link
        to="/"
        className="bg-primary text-primary-foreground mt-8 rounded px-4 py-2"
      >
        Go back to home
      </Link>
    </div>
  )
}
