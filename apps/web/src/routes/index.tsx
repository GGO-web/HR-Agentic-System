import { createFileRoute, useRouter } from "@tanstack/react-router"
import { Link } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import { FileText, Mic, GitBranch } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useAuth } from "@/hooks/useAuth"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="from-background to-muted flex flex-1 flex-col items-center justify-center bg-gradient-to-b px-6 py-24 text-center">
        <h1 className="mb-6 text-4xl font-bold sm:text-5xl md:text-6xl">
          {t("home.title")}
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl text-xl">
          {t("home.subtitle")}
        </p>

        <div className="flex flex-wrap gap-4">
          {isSignedIn ? (
            <Link to={router.routesByPath["/dashboard"].fullPath}>
              <Button size="lg">{t("home.goToDashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link to={router.routesByPath["/sign-up"].fullPath}>
                <Button size="lg">{t("home.getStarted")}</Button>
              </Link>
              <Link to={router.routesByPath["/sign-in"].fullPath}>
                <Button size="lg" variant="outline">
                  {t("navigation.signIn")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-background px-6 py-16">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center text-3xl font-bold">
            {t("home.keyFeatures")}
          </h2>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
              <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full p-3">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">
                {t("home.aiQuestionGeneration.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.aiQuestionGeneration.description")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
              <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full p-3">
                <Mic className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">
                {t("home.audioInterviewFlow.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.audioInterviewFlow.description")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border-border bg-card rounded-lg border p-6 shadow-sm">
              <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-full p-3">
                <GitBranch className="text-primary h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-medium">
                {t("home.roleBasedAccess.title")}
              </h3>
              <p className="text-muted-foreground">
                {t("home.roleBasedAccess.description")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
