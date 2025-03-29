
import { useState, useEffect, forwardRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { 
  InputOTP, 
  InputOTPGroup, 
  InputOTPSlot 
} from '@/components/ui/input-otp'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const ADMIN_EMAIL = 'admin@admin.com'

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6)
})

type OtpFormValues = z.infer<typeof otpSchema>

export const AuthForms = forwardRef<HTMLDivElement, {}>((props, ref) => {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { signIn, verifyOtp } = useAuth()

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      await signIn(email)
      
      // For admin, we don't need to show OTP screen as login is handled directly
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        return
      }
      
      setIsEmailSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  const onOTPSubmit = async (data: OtpFormValues) => {
    setIsLoading(true)
    try {
      await verifyOtp(email, data.otp)
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>We've sent a 6-digit code to {email}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onOTPSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-4">
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify code
              </Button>
              <Button 
                variant="ghost" 
                type="button"
                className="w-full"
                onClick={() => setIsEmailSent(false)}
              >
                Use a different email
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto" ref={ref}>
      <CardHeader>
        <CardTitle>Sign in to Digital Toastmasters</CardTitle>
        <CardDescription>
          {email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
            ? "Enter admin email to login directly"
            : "Enter your email to receive a verification code"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com"
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
              <p className="text-xs text-muted-foreground mt-1">
                Admin login: No verification code required
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
              ? "Login as Admin"
              : "Send verification code"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
})

// For backwards compatibility
export { AuthForms as AuthForms }
