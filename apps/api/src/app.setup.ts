import type { INestApplication } from '@nestjs/common';
import type { AppConfig } from './config/app.config.js';

export function setupApp(app: INestApplication, config: AppConfig): void {
  app.setGlobalPrefix(config.apiPrefix);
  app.enableCors({
    origin: config.corsOrigin,
  });
}
