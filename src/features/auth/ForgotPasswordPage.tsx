import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useForgotPassword } from '@/gen/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const forgot = useForgotPassword()
  const result = forgot.data

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We’ll email you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4 text-sm">
              <p>{result.message}</p>
              {result.resetToken && (
                <p className="rounded-md bg-muted px-3 py-2 text-xs">
                  Dev shortcut (no mail configured):{' '}
                  <Link className="text-primary underline" to={`/reset-password?token=${result.resetToken}`}>
                    reset your password
                  </Link>
                </p>
              )}
              <Link to="/login" className="block text-center text-primary underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (email) forgot.mutate({ data: { email } })
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={forgot.isPending || !email}>
                {forgot.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset link
              </Button>
              <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
