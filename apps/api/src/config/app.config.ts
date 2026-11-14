import { registerAs, type ConfigType } from '@nestjs/config';
import {
  readHttpUrl,
  readNonEmptyString,
  readPositiveInteger,
} from './environment.validation.js';

export const appConfig = registerAs('app', () => {
  const apiPrefix = readNonEmptyString('API_PREFIX', 'api').replace(
    /^\/+|\/+$/g,
    '',
  );

  if (apiPrefix.length === 0) {
    throw new Error('API_PREFIX precisa conter ao menos um caractere.');
  }

  return {
    port: readPositiveInteger('PORT', 4000),
    apiPrefix,
    corsOrigin: readHttpUrl('CORS_ORIGIN', 'http://localhost:5173'),
  };
});

export type AppConfig = ConfigType<typeof appConfig>;
