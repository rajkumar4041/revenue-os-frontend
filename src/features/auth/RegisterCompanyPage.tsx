import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useRegisterCompany } from '@/gen/hooks'
import { useAuth } from '@/store/auth'
import { setTokens } from '@/lib/tokenStorage'
import { getApiErrorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout, OrDivider, SocialButtons } from './AuthLayout'

const schema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  adminName: z.string().min(1, 'Your name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
})

type FormValues = z.infer<typeof schema>

export default function RegisterCompanyPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const registerCompany = useRegisterCompany()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => {
    registerCompany.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          const u = data.user
          setTokens(data.accessToken ?? '', data.refreshToken ?? '')
          setUser({
            id: u?.id ?? '',
            name: u?.name ?? '',
            email: u?.email ?? '',
            organizationId: u?.organizationId ?? '',
            roles: u?.roles ?? [],
            permissions: u?.permissions ?? [],
          })
          navigate('/', { replace: true })
        },
      },
    )
  }

  return (
    <AuthLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Start your 20-day trial</h1>
        <p className="text-sm text-muted-foreground">No credit card. No sales call. Just ship.</p>
      </div>

      <SocialButtons />
      <div className="my-4">
        <OrDivider />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company</Label>
            <Input id="companyName" placeholder="Acme Inc" {...register('companyName')} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="adminName">Your name</Label>
            <Input id="adminName" placeholder="Ada Lovelace" {...register('adminName')} />
            {errors.adminName && <p className="text-xs text-destructive">{errors.adminName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="8+ characters" {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>

        {registerCompany.isError && (
          <p className="text-sm text-destructive">{getApiErrorMessage(registerCompany.error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={registerCompany.isPending}>
          {registerCompany.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Start free trial
          {!registerCompany.isPending && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
