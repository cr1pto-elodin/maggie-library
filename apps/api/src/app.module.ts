import { Module } from '@nestjs/common';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [DocumentsModule, HealthModule],
})
export class AppModule {}
