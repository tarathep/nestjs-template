import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Ip,
  Logger,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { Sessions } from './entities/session.entity';

@Controller('sessions')
export class SessionsController {
  private readonly logger = new Logger(SessionsController.name);

  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  async createSession(
    @Body('user_id') userId: string,
    @Ip() ipAddr: string,
  ): Promise<Sessions> {
    this.logger.log(`Creating session for user ${userId} from IP ${ipAddr}`);
    return this.sessionsService.createSession(userId, ipAddr);
  }

  @Get('user/:userId')
  async getActiveSessions(
    @Param('userId') userId: string,
  ): Promise<Sessions[]> {
    return this.sessionsService.getActiveSessionsByUserId(userId);
  }

  // @Patch('deactivate/:id')
  // async deactivateSession(
  //   @Param('id') id: string,
  // ): Promise<{ success: boolean }> {
  //   await this.sessionsService.deactivateSession(id);
  //   return { success: true };
  // }
}
