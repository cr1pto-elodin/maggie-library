import {
  readPositiveInteger,
  readString,
} from './environment/environment-reader'

export const httpConfig = Object.freeze({
  baseUrl: readString('VITE_API_BASE_URL', '/api'),
  timeoutMs: readPositiveInteger('VITE_HTTP_TIMEOUT_MS', 30_000),
})
