import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './app.config.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class ConfigurationModule {}
