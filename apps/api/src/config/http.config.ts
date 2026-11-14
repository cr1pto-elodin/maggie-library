import { registerAs, type ConfigType } from '@nestjs/config';
import { readPositiveInteger } from './environment.validation.js';

export const httpConfig = registerAs('http', () => ({
  timeoutMs: readPositiveInteger('HTTP_TIMEOUT_MS', 30_000),
}));

export type HttpConfig = ConfigType<typeof httpConfig>;
