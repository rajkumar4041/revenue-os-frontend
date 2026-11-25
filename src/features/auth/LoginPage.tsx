import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { useLogin } from '@/api/auth'
import { useAuth } from '@/store/auth'
import { setTokens } from '@/lib/tokenStorage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout, OrDivider, SocialButtons } from './AuthLayout'

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof schema>

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Invalid email or password'
    return error.response?.data?.detail ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const redirectTo = (location.state as { from?: string })?.from ?? '/'

  const onSubmit = (values: LoginForm) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        setTokens(data.accessToken, data.refreshToken)
        setUser(data.user)
        navigate(redirectTo, { replace: true })
      },
    })
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back — let’s get to work.</p>
      </div>

      <SocialButtons />
      <div className="my-4">
        <OrDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {loginMutation.isError && (
          <p className="text-sm text-destructive">{errorMessage(loginMutation.error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        New to RevenueOS?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Start your 20-day trial
        </Link>
      </p>
      <p className="mt-2 text-xs text-muted-foreground">Demo — admin@demo.io / Password123!</p>
    </AuthLayout>
  )
}
