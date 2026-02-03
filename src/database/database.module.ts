import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigAsync } from './typeorm.config';
import { DatabaseService } from './database.service';

@Module({
  imports: [TypeOrmModule.forRootAsync(typeOrmConfigAsync)],
  providers: [DatabaseService],
})
export class DatabaseModule {}
