import axios, { isAxiosError } from 'axios'
import { httpConfig } from '../config'

export const httpClient = axios.create({
  baseURL: httpConfig.baseUrl,
  timeout: httpConfig.timeoutMs,
})

export function getRequestErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback
  }

  const message = error.response?.data?.message

  if (Array.isArray(message)) {
    return message.join(' ')
  }

  return typeof message === 'string' && message.length > 0
    ? message
    : fallback
}
