import { registerAs, type ConfigType } from '@nestjs/config';
import {
  readPositiveInteger,
  readPostgresUrl,
} from '../../config/environment/environment-reader.js';

export const DEFAULT_DATABASE_URL =
  'postgresql://maggie:maggie@localhost:5433/maggie_library';

export const databaseConfig = registerAs('database', () => ({
  url: readPostgresUrl('DATABASE_URL', DEFAULT_DATABASE_URL),
  poolMax: readPositiveInteger('DATABASE_POOL_MAX', 10),
}));

export type DatabaseConfig = ConfigType<typeof databaseConfig>;
