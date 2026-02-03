import { Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/jwt-payload.type'

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: JwtPayload) {
    const secret = this.config.get<string>('jwt.accessSecret')!;
    const expiresIn = this.config.get<string>('jwt.accessExpiresIn')!;
    const options: JwtSignOptions = {
      secret,
      expiresIn: expiresIn as any,
    };

    return this.jwtService.sign(payload, options);
  }

  signRefreshToken(payload: JwtPayload) {
    const secret = this.config.get<string>('jwt.refreshSecret')!;
    const expiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;

    const options: JwtSignOptions = {
      secret,
      expiresIn: expiresIn as any,
    };

    return this.jwtService.sign(payload, options);
  }

  verifyRefreshToken(token: string): JwtPayload {
    const secret = this.config.get<string>('jwt.refreshSecret')!;
    return this.jwtService.verify<JwtPayload>(token, { secret });
  }
}
