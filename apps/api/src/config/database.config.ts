import { registerAs, type ConfigType } from '@nestjs/config';
import {
  readPositiveInteger,
  readPostgresUrl,
} from './environment.validation.js';

export const databaseConfig = registerAs('database', () => ({
  url: readPostgresUrl(
    'DATABASE_URL',
    'postgresql://maggie:maggie@localhost:5433/maggie_library',
  ),
  poolMax: readPositiveInteger('DATABASE_POOL_MAX', 10),
}));

export type DatabaseConfig = ConfigType<typeof databaseConfig>;
