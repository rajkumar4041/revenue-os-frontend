import { Loader2 } from 'lucide-react'
import { useListActivity } from '@/gen/hooks'
import { useAuth } from '@/store/auth'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function timeAgo(iso?: string) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function ActivityPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('REPORT_VIEW')
  const { data, isLoading, isError } = useListActivity({ page: 0, size: 50 }, { query: { enabled: canView } })

  if (!canView) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">No access</CardTitle>
          <CardDescription>You don’t have permission to view activity.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const entries = data?.content ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">Everything happening across your organization.</p>
      </div>

      <Card>
        <CardContent className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-destructive">Could not load activity.</p>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="relative space-y-5 border-l pl-6">
              {entries.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{entry.action?.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <span className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm">{entry.metadata}</p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
