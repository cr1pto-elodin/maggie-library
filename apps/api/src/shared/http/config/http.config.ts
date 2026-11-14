import { registerAs, type ConfigType } from '@nestjs/config';
import { readPositiveInteger } from '../../../config/environment/environment-reader.js';

export const httpConfig = registerAs('http', () => ({
  timeoutMs: readPositiveInteger('HTTP_TIMEOUT_MS', 30_000),
}));

export type HttpConfig = ConfigType<typeof httpConfig>;
