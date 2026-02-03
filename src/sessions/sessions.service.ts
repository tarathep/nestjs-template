import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sessions } from './entities/session.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(Sessions)
    private readonly sessionsRepository: Repository<Sessions>,
  ) {}

  async createSession(userId: string, ipAddr?: string): Promise<Sessions> {
    const session_id = randomUUID().replace(/-/g, '').slice(0, 11);
    const session = this.sessionsRepository.create({
      user_id: userId,
      session_id: session_id,
      is_active: true,
      ip_addr: ipAddr || undefined,
      created_at: new Date(Date.now()),
    });
    this.logger.log(
      `Creating session for user ${userId} with ID ${session_id}`,
    );
    this.logger.debug(`Session details: ${JSON.stringify(session)}`);
    return this.sessionsRepository.save(session);
  }

  async findActiveSessionById(sessionId: string): Promise<Sessions | null> {
    const session = await this.sessionsRepository.findOne({
      where: {
        session_id: sessionId,
        is_active: true,
      },
    });

    if (!session) {
      this.logger.warn(
        `❌ No active session found for sessionId: ${sessionId}`,
      );
      return null;
    }

    const baseTime = session.last_seen_at ?? session.created_at;
    const sessionAge = Date.now() - new Date(baseTime).getTime();

    const SESSION_TTL_MS = 120 * 60 * 1000; // 2 hour TTL

    if (sessionAge > SESSION_TTL_MS) {
      await this.deactivateSessionBySessionId(session.id);

      this.logger.warn(
        `⚠️ Session ${session.session_id} expired after ${(sessionAge / 1000).toFixed(2)} seconds.`,
      );
      return null;
    }

    this.logger.debug(
      `✅ Active session ${session.session_id} is valid (age: ${(sessionAge / 1000).toFixed(2)} seconds).`,
    );

    return session;
  }

  async getActiveSessionsByUserId(userId: string): Promise<Sessions[]> {
    return this.sessionsRepository.find({
      where: {
        user_id: userId,
        is_active: true,
      },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.sessionsRepository.update(
      { session_id: sessionId, is_active: true },
      { last_seen_at: new Date() },
    );
  }

  async deactivateSessionBySessionId(sessionId: string): Promise<boolean> {
    this.logger.debug(`Deactivating session with ID=${sessionId}`);
    const result = await this.sessionsRepository.update(
      { session_id: sessionId, is_active: true },
      { is_active: false },
    );
    this.logger.debug(`Session ${sessionId} update result: ${result.affected}`);

    return (result.affected ?? 0) > 0;
  }

  async terminateAllActiveByUser(userId: string): Promise<number> {
    this.logger.debug(`Terminating all active sessions for userId=${userId}`);
    if (!userId) return 0;

    const res = await this.sessionsRepository.update(
      { user_id: userId, is_active: true },
      { is_active: false },
    );

    this.logger.log(
      `Terminated ${res.affected ?? 0} active session(s) for userId=${userId}`,
    );
    return res.affected ?? 0;
  }
}
