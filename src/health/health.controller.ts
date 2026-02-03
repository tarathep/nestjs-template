import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('db')
  async checkDatabase() {
    const isInitialized = this.dataSource.isInitialized;

    const result = await this.dataSource.query('SELECT 1 AS ok');

    return {
      databaseConnected: isInitialized,
      result,
    };
  }
}
