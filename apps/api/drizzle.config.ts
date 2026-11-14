import { defineConfig } from 'drizzle-kit';
import { DEFAULT_DATABASE_URL } from './src/database/config/database.config.js';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  },
});
