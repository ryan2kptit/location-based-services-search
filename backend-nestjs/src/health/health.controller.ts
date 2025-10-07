import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@SkipThrottle() // Health checks should not be rate limited
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check application health' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  check() {
    return this.health.check([
      // Database check
      () => this.db.pingCheck('database'),

      // Disk storage check (90% threshold)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),

      // Memory heap check (150MB threshold)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Memory RSS check (300MB threshold)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if application is ready' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
  })
  ready() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Check if application is alive' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
  })
  live() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
