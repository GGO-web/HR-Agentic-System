import { SignIn } from "@clerk/clerk-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/")({
  component: SignInPage,
});

function SignInPage() {
  const router = useRouter();

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
          signUpUrl={router.routesByPath["/sign-up"].fullPath}
        />
      </div>
    </div>
  );
}
