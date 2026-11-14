import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { HttpClientModule } from './http-client.module.js';

describe('HttpClientModule', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('applies the configured timeout', async () => {
    vi.stubEnv('HTTP_TIMEOUT_MS', '15000');
    const module = await Test.createTestingModule({
      imports: [HttpClientModule],
    }).compile();
    const httpService = module.get(HttpService);

    expect(httpService.axiosRef.defaults.timeout).toBe(15_000);

    await module.close();
  });
});
