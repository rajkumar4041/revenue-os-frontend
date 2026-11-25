import { cn } from '@/lib/utils'

function initials(name?: string) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ name, className }: { name?: string; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
