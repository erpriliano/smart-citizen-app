import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AdministrativeRequest } from './administrative-session.guard';
import { REQUIRED_PERMISSIONS_KEY } from './required-permissions.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AdministrativeRequest>();
    const session = request.administrativeSession;
    if (!session) throw new UnauthorizedException('Your session is no longer valid.');

    const required =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const granted = new Set(session.permissions);

    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException('You do not have access to this resource.');
    }

    return true;
  }
}
