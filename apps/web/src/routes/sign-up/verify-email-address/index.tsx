import { useSignUp } from "@clerk/clerk-react"
import { zodResolver } from "@hookform/resolvers/zod"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "react-toastify"
import { type z } from "zod"

import { verificationFormSchema } from "./schema/verification.schema"

export const Route = createFileRoute("/sign-up/verify-email-address/")({
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [isCodeSent, setIsCodeSent] = useState(false)
  const navigate = useNavigate()

  // Initialize React Hook Form
  const form = useForm({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      verificationCode: "",
    },
  })

  const isSubmitting = form.formState.isSubmitting

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

  async function onSubmit(data: z.infer<typeof verificationFormSchema>) {
    try {
      if (!signUp) return

      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: data.verificationCode,
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
    }
  }

  async function handleResendCode() {
    try {
      if (signUp) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
        setIsCodeSent(true)
        toast.info("Verification code has been resent to your email")
      }
    } catch (error) {
      toast.error("Failed to resend code. Please try again.")
      console.error(error)
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <FormField
                  control={form.control}
                  name="verificationCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter code"
                          {...field}
                          autoComplete="one-time-code"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
        </Form>
      </Card>
    </div>
  )
}
