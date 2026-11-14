import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { httpConfig, type HttpConfig } from './config/http.config.js';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule.forFeature(httpConfig)],
      inject: [httpConfig.KEY],
      useFactory: (config: HttpConfig) => ({
        timeout: config.timeoutMs,
      }),
    }),
  ],
  exports: [HttpModule],
})
export class HttpClientModule {}
