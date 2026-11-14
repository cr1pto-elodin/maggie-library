import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config.js';
import { databaseConfig } from './database.config.js';
import { documentsConfig } from './documents.config.js';
import { httpConfig } from './http.config.js';
import { ollamaConfig } from './ollama.config.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        appConfig,
        databaseConfig,
        documentsConfig,
        httpConfig,
        ollamaConfig,
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigurationModule {}
