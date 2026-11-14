import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  databaseConfig,
  type DatabaseConfig,
} from '../config/database.config.js';
import { DATABASE, DATABASE_POOL } from './database.constants.js';
import { DatabaseLifecycleService } from './database-lifecycle.service.js';
import * as schema from './schema.js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [databaseConfig.KEY],
      useFactory: (config: DatabaseConfig) =>
        new Pool({ connectionString: config.url, max: config.poolMax }),
    },
    {
      provide: DATABASE,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
    },
    DatabaseLifecycleService,
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
