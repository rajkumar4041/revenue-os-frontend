import type { ReactNode } from 'react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

const HERO_BG = {
  background:
    'radial-gradient(60% 50% at 75% 15%, rgba(99,102,241,0.28), transparent 70%),' +
    'radial-gradient(55% 55% at 15% 85%, rgba(217,70,239,0.20), transparent 70%),' +
    '#09090b',
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Branded hero stays dark in both themes; the form side follows the theme. */}
      <div className="relative hidden flex-1 overflow-hidden text-zinc-100 lg:block" style={HERO_BG}>
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              R
            </span>
            <span className="text-base font-semibold">RevenueOS</span>
          </div>

          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Teams run their business on RevenueOS
            </span>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.1] tracking-tight">
              The platform to
              <br />
              run your{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
                company
              </span>
              .
            </h1>
            <p className="mt-5 max-w-md text-zinc-400">
              CRM, projects, timesheets, billing and revenue — one modern workspace. Production-ready
              from the day you sign up.
            </p>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Clients · Projects · Timesheets · Invoices · Revenue
          </p>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center p-6 lg:w-[520px]">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

export function SocialButtons() {
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled
        title="SSO coming soon"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-secondary/40 px-4 py-2.5 text-sm font-medium opacity-60"
      >
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
          G
        </span>
        Continue with Google
      </button>
      <button
        type="button"
        disabled
        title="SSO coming soon"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-secondary/40 px-4 py-2.5 text-sm font-medium opacity-60"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current" aria-hidden>
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38v-1.33c-2.23.49-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        Continue with GitHub
      </button>
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      OR
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
