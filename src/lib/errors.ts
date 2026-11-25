import { isAxiosError } from 'axios'

interface ProblemDetail {
  detail?: string
  fieldErrors?: Record<string, string>
}

/** Pulls a human-readable message out of our backend's RFC-7807 error bodies. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as ProblemDetail | undefined
    const firstFieldError = data?.fieldErrors ? Object.values(data.fieldErrors)[0] : undefined
    return firstFieldError ?? data?.detail ?? fallback
  }
  return fallback
}
