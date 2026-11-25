import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Play, Square, Timer } from 'lucide-react'
import { useActiveTimer, useListProjects, useStartTimer, useStopTimer } from '@/gen/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export function TimerWidget({ onChange }: { onChange: () => void }) {
  const queryClient = useQueryClient()
  const active = useActiveTimer()
  const projectsQuery = useListProjects({ page: 0, size: 100 })
  const startTimer = useStartTimer()
  const stopTimer = useStopTimer()

  const [projectId, setProjectId] = useState('')
  const [description, setDescription] = useState('')
  const [now, setNow] = useState(() => Date.now())

  const running = active.data
  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [running])

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: [{ url: '/api/v1/timer/active' }] })
    onChange()
  }

  const handleStart = () => {
    if (!projectId) return
    startTimer.mutate(
      { data: { projectId, description: description || undefined } },
      {
        onSuccess: () => {
          setDescription('')
          refresh()
        },
      },
    )
  }

  const handleStop = () => stopTimer.mutate(undefined, { onSuccess: refresh })

  const elapsed = running?.startedAt
    ? formatElapsed(now - new Date(running.startedAt).getTime())
    : '00:00:00'

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Timer className="h-5 w-5" />
        </span>

        {running ? (
          <>
            <div className="flex-1">
              <p className="font-mono text-2xl font-semibold tabular-nums">{elapsed}</p>
              <p className="text-xs text-muted-foreground">
                {running.description || 'Tracking time…'}
              </p>
            </div>
            <Button variant="destructive" onClick={handleStop} disabled={stopTimer.isPending}>
              <Square className="h-4 w-4" />
              Stop
            </Button>
          </>
        ) : (
          <>
            <Select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="sm:w-48"
            >
              <option value="">Select project…</option>
              {projectsQuery.data?.content?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleStart} disabled={!projectId || startTimer.isPending}>
              <Play className="h-4 w-4" />
              Start
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
