import { Module } from '@nestjs/common';
import { ConfigurationModule } from './config/configuration.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { HttpClientModule } from './shared/http/http-client.module.js';

@Module({
  imports: [
    ConfigurationModule,
    HttpClientModule,
    DocumentsModule,
    HealthModule,
  ],
})
export class AppModule {}
