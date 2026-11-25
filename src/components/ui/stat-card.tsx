import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  hint?: string
  trend?: { value: string; positive?: boolean }
}

export function StatCard({ label, value, icon: Icon, hint, trend }: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {(trend || hint) && (
        <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                'font-medium',
                trend.positive === false ? 'text-destructive' : 'text-emerald-600',
              )}
            >
              {trend.value}
            </span>
          )}
          {hint}
        </p>
      )}
    </Card>
  )
}
