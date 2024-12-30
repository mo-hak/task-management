import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppConfigModule } from '../src/config/config.module';

describe('Configuration (e2e)', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppConfigModule],
    }).compile();

    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  it('should load environment variables', () => {
    expect(configService.get('nodeEnv')).toBe('test');
    expect(configService.get('port')).toBe(3002);
    expect(configService.get('apiPrefix')).toBe('api');
    expect(configService.get('database.url')).toBeDefined();
    expect(configService.get('jwt.secret')).toBeDefined();
  });

  it('should have correct default values', () => {
    expect(configService.get('throttle.ttl')).toBe(60);
    expect(configService.get('throttle.limit')).toBe(100);
    expect(configService.get('logLevel')).toBe('error');
  });

  it('should validate required environment variables', () => {
    expect(configService.get('database.url')).toBeTruthy();
    expect(configService.get('jwt.secret')).toBeTruthy();
  });

  it('should have correct API documentation settings', () => {
    expect(configService.get('swagger.title')).toBe('Task Management API Test');
    expect(configService.get('swagger.version')).toBe('1.0');
    expect(configService.get('swagger.path')).toBe('docs');
  });
}); 