import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { TokenService } from './tokens/token.service';
import { JwtPayload } from './types/jwt-payload.type';
import { Role } from 'src/common/enums/role.enum';
import { User } from 'src/users/entities/user.entity';
import { SessionsService } from 'src/sessions/sessions.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionsService,
  ) {}

  private async hash(value: string) {
    return bcrypt.hash(value, 10);
  }

  private mapRoleNameToEnum(name?: string | null): Role | null {
    const n = (name || '').toLowerCase();

    if (n.includes('admin')) return Role.Admin;

    if (n === 'user' || n.includes(' user')) return Role.User;

    if (n.includes('partner') || n.includes('support') || n.includes('back'))
      return Role.User;

    return null;
  }

  private extractRoles(user: User): Role[] {
    const roles = (user.userRoleAssignments ?? [])
      .map((a) => this.mapRoleNameToEnum(a.role?.name))
      .filter((r): r is Role => !!r);

    return roles.length ? Array.from(new Set(roles)) : [Role.User];
  }

  private extractPermissions(user: User): string[] {
    const perms = (user.userRoleAssignments ?? [])
      .flatMap((a) => a.role?.rolePermissionAssignments ?? [])
      .map((rpa) => rpa.permission?.id)
      .filter((p): p is string => !!p);

    return Array.from(new Set(perms));
  }

  async login(email: string, password: string, ipAddr?: string) {
    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    const user = await this.users.findByEmail(email.toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const roles = this.extractRoles(user);
    const permissions = this.extractPermissions(user);

    const session = await this.sessions.createSession(user.id, ipAddr);
    const sessionId = session.session_id;

    const payload: JwtPayload = {
      id: user.id,
      username: user.name ?? user.email.split('@')[0],
      email: user.email,
      permissions,
      roles,
      sessionId,
    };

    const accessToken = this.tokens.signAccessToken(payload);
    const refreshToken = this.tokens.signRefreshToken(payload);

    const hashedRefreshToken = await this.hash(refreshToken);
    await this.users.setHashedRefreshToken(user.id, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken)
      throw new BadRequestException('refreshToken is required');

    let payload: JwtPayload;
    try {
      payload = this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const active = await this.sessions.findActiveSessionById(payload.sessionId);
    if (!active) throw new UnauthorizedException('Session expired');

    await this.sessions.touchSession(payload.sessionId);

    const user = await this.users.findByIdWithRoles(payload.id);
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.hashedRefreshToken) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const matches = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!matches) throw new UnauthorizedException('Refresh token revoked');

    const roles = this.extractRoles(user);
    const permissions = this.extractPermissions(user);

    const newPayload: JwtPayload = {
      id: user.id,
      username: user.name ?? user.email.split('@')[0],
      email: user.email,
      permissions,
      roles,
      sessionId: payload.sessionId,
    };

    const newAccessToken = this.tokens.signAccessToken(newPayload);
    const newRefreshToken = this.tokens.signRefreshToken(newPayload);

    const newHashed = await this.hash(newRefreshToken);
    await this.users.setHashedRefreshToken(user.id, newHashed);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string, sessionId?: string) {
    if (!userId) throw new BadRequestException('userId is required');

    await this.users.setHashedRefreshToken(userId, null);

    if (sessionId) {
      await this.sessions.deactivateSessionBySessionId(sessionId);
    } else {
      await this.sessions.terminateAllActiveByUser(userId);
    }

    return { ok: true };
  }
}
