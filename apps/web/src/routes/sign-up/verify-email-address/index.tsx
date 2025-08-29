import { useSignUp } from "@clerk/clerk-react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"

export const Route = createFileRoute("/sign-up/verify-email-address/")({
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [verificationCode, setVerificationCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCodeSent, setIsCodeSent] = useState(false)
  const navigate = useNavigate()

  // Send verification code when component mounts
  useEffect(() => {
    async function sendVerificationCode() {
      if (isLoaded && signUp) {
        try {
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          })
          setIsCodeSent(true)
        } catch (error) {
          console.error("Failed to send verification code:", error)
        }
      }
    }

    if (isLoaded && signUp && !isCodeSent) {
      void sendVerificationCode()
    }
  }, [isLoaded, signUp, isCodeSent])

  if (!isLoaded || !signUp) {
    return <div>Loading...</div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!verificationCode) {
      toast.error("Please enter the verification code")
      return
    }

    try {
      setIsSubmitting(true)
      if (!signUp) return
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (completeSignUp.status === "complete") {
        if (setActive) {
          await setActive({ session: completeSignUp.createdSessionId })
        }
        toast.success("Your email has been verified successfully")
        await navigate({ to: "/" })
      } else {
        toast.error("Verification failed. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to verify email. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResendCode() {
    try {
      if (signUp) {
        setIsSubmitting(true)
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
        setIsCodeSent(true)
        toast.info("Verification code has been resent to your email")
      }
    } catch (error) {
      toast.error("Failed to resend code. Please try again.")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  placeholder="Enter code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Verifying..." : "Verify Email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={isSubmitting}
            >
              Resend Code
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
