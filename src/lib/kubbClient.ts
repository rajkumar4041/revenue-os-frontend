import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { api } from './axios'

// Custom client for Kubb-generated code. Routing generated requests through our
// shared `api` instance means they get the auth header and silent token refresh
// for free, exactly like the hand-written calls.

export type RequestConfig<TData = unknown> = {
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
}

export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>

export const client = async <TData, _TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> => {
  const response = await api.request<TData>({ ...config } as AxiosRequestConfig)
  return {
    data: response.data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  }
}

export default client
