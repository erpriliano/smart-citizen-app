import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import type { AdministrativeRequest } from './administrative-session.guard';

@Injectable()
export class CommunityScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdministrativeRequest>();
    const session = request.administrativeSession;
    if (!session) throw new UnauthorizedException('Your session is no longer valid.');

    if (request.params['communityId'] !== session.community.id) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    return true;
  }
}
