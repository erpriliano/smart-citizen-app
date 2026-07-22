import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { SessionContext } from '@smart-citizen/identity-contracts';

import type { AdministrativeRequest } from './administrative-session.guard';

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): SessionContext => {
    const request = context.switchToHttp().getRequest<AdministrativeRequest>();
    if (!request.administrativeSession) {
      throw new UnauthorizedException('Your session is no longer valid.');
    }
    return request.administrativeSession;
  },
);
