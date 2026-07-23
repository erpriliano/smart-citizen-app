import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { SessionContext } from '@smart-citizen/identity-contracts';

import { IdentitySessionService } from './identity-session.service';
import { IDENTITY_SESSION_COOKIE } from './session-cookie';

export interface AdministrativeRequest {
  administrativeSession?: SessionContext;
  cookies?: Record<string, unknown>;
  params: Record<string, string | undefined>;
}

@Injectable()
export class AdministrativeSessionGuard implements CanActivate {
  constructor(private readonly sessions: IdentitySessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdministrativeRequest>();
    if (request.administrativeSession) return true;

    const token = request.cookies?.[IDENTITY_SESSION_COOKIE] as unknown;
    if (typeof token !== 'string' || token.length === 0) this.reject();

    try {
      request.administrativeSession = await this.sessions.readSession(token);
      return true;
    } catch {
      this.reject();
    }
  }

  private reject(): never {
    throw new UnauthorizedException('Your session is no longer valid.');
  }
}
