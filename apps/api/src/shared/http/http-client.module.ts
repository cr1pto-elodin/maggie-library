import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigurationModule } from '../../config/configuration.module.js';
import { httpConfig, type HttpConfig } from '../../config/http.config.js';

@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigurationModule],
      inject: [httpConfig.KEY],
      useFactory: (config: HttpConfig) => ({
        timeout: config.timeoutMs,
      }),
    }),
  ],
  exports: [HttpModule],
})
export class HttpClientModule {}
