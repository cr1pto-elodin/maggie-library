import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './app.setup.js';
import { appConfig, type AppConfig } from './config/app.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(appConfig.KEY);

  setupApp(app, config);

  await app.listen(config.port);
}
await bootstrap();
