import { createFileRoute } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"

import { useAuth } from "@/hooks/useAuth"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const { isSignedIn } = useAuth()

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
            <Link to="/dashboard">
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/sign-up">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link to="/sign-in">
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h2" />
                  <path d="M8 17h2" />
                  <path d="M14 13h2" />
                  <path d="M14 17h2" />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M20 7h-9" />
                  <path d="M14 17H5" />
                  <circle cx="17" cy="17" r="3" />
                  <circle cx="7" cy="7" r="3" />
                </svg>
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
