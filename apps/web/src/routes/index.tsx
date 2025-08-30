import { createFileRoute, useRouter } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { FileText, Mic, GitBranch } from "lucide-react"

import { useAuth } from "@/hooks/useAuth"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="from-background to-muted flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-6 py-24 text-center">
        <h1 className="mb-6 text-4xl font-bold sm:text-5xl md:text-6xl">
          AI-Powered HR Interview Platform
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl text-xl">
          Streamline your hiring process with our intelligent interview system.
          Generate tailored questions, conduct interviews, and analyze responses
          with AI.
        </p>

        <div className="flex flex-wrap gap-4">
          {isSignedIn ? (
            <Link to={router.routesByPath["/dashboard"].fullPath}>
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to={router.routesByPath["/sign-up"].fullPath}>
                <Button size="lg">Get Started</Button>
              </Link>
              <Link to={router.routesByPath["/sign-in"].fullPath}>
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-6 py-16">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">Key Features</h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
              <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full p-3">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">
                AI Question Generation
              </h3>
              <p className="text-muted-foreground">
                Upload job descriptions and let our AI generate tailored
                interview questions automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
              <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full p-3">
                <Mic className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Audio Interview Flow</h3>
              <p className="text-muted-foreground">
                Conduct interviews with audio responses, text-to-speech
                questions, and a seamless user experience.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
              <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full p-3">
                <GitBranch className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">Role-Based Access</h3>
              <p className="text-muted-foreground">
                Separate interfaces for HR managers and candidates with
                appropriate permissions and features.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
