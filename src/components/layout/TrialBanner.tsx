import { Sparkles } from 'lucide-react'
import { useGetOrganization } from '@/gen/hooks'
import { useAuth } from '@/store/auth'
import { cn } from '@/lib/utils'

export function TrialBanner() {
  const { user } = useAuth()
  const org = useGetOrganization(user?.organizationId ?? '', {
    query: { enabled: !!user?.organizationId },
  })

  const trialEndsAt = org.data?.trialEndsAt
  if (!trialEndsAt) return null

  const msLeft = new Date(trialEndsAt).getTime() - Date.now()
  const daysLeft = Math.ceil(msLeft / 86_400_000)
  const expired = daysLeft <= 0

  return (
    <div
      className={cn(
        'mb-6 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm',
        expired
          ? 'border-destructive/40 bg-destructive/5 text-destructive'
          : 'border-primary/30 bg-primary/5',
      )}
    >
      <span className="flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        {expired
          ? 'Your free trial has ended.'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial.`}
      </span>
      <button type="button" className="font-medium text-primary hover:underline">
        Upgrade
      </button>
    </div>
  )
}
