import { ForbiddenException, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AdministrativeSessionGuard,
  type AdministrativeRequest,
} from './administrative-session.guard';
import { CommunityScopeGuard } from './community-scope.guard';
import { IdentitySessionService, InvalidSessionError } from './identity-session.service';
import { PermissionGuard } from './permission.guard';
import { REQUIRED_PERMISSIONS_KEY } from './required-permissions.decorator';

const communityId = '40db0b3f-0354-4f47-96df-bac69dc711a9';
const otherCommunityId = '8e219170-e33b-434c-8fc2-e9a9eb7868b1';

const session: SessionContext = {
  user: {
    id: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5',
    email: 'admin@example.test',
  },
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  community: {
    id: communityId,
    name: 'RT 05 Taman Warga',
    slug: 'rt-05-taman-warga',
    timezone: 'Asia/Jakarta',
    currency: 'IDR',
  },
  positions: [{ code: 'pak-rt', name: 'Pak RT' }],
  roles: [{ code: 'community-admin', name: 'Community Administrator' }],
  permissions: ['finance.report.read'],
};

function executionContext(
  request: AdministrativeRequest,
  handler: () => void = () => undefined,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
    getHandler: () => handler,
    getClass: () => class TestController {},
    getArgs: () => [],
    getArgByIndex: () => undefined,
    switchToRpc: () => ({ getContext: () => undefined, getData: () => undefined }),
    switchToWs: () => ({
      getClient: () => undefined,
      getData: () => undefined,
      getPattern: () => '',
    }),
    getType: () => 'http',
  } as ExecutionContext;
}

describe('administrative API guards', () => {
  const sessions = { readSession: vi.fn() };
  let sessionGuard: AdministrativeSessionGuard;
  let communityGuard: CommunityScopeGuard;
  let permissionGuard: PermissionGuard;

  beforeEach(async () => {
    vi.clearAllMocks();
    sessions.readSession.mockResolvedValue(session);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdministrativeSessionGuard,
        CommunityScopeGuard,
        PermissionGuard,
        { provide: IdentitySessionService, useValue: sessions },
      ],
    }).compile();

    sessionGuard = moduleRef.get(AdministrativeSessionGuard);
    communityGuard = moduleRef.get(CommunityScopeGuard);
    permissionGuard = moduleRef.get(PermissionGuard);
  });

  it('resolves and attaches a valid administrative session once', async () => {
    const request = {
      cookies: { smart_citizen_session: 'signed-session-token' },
      params: { communityId },
    } as AdministrativeRequest;

    await expect(sessionGuard.canActivate(executionContext(request))).resolves.toBe(true);
    await expect(sessionGuard.canActivate(executionContext(request))).resolves.toBe(true);

    expect(request.administrativeSession).toEqual(session);
    expect(sessions.readSession).toHaveBeenCalledOnce();
    expect(sessions.readSession).toHaveBeenCalledWith('signed-session-token');
  });

  it('maps absent and invalid cookies to one generic unauthorised response', async () => {
    const absentRequest = { cookies: {}, params: { communityId } } as AdministrativeRequest;

    await expect(sessionGuard.canActivate(executionContext(absentRequest))).rejects.toEqual(
      new UnauthorizedException('Your session is no longer valid.'),
    );

    sessions.readSession.mockRejectedValue(new InvalidSessionError());
    const invalidRequest = {
      cookies: { smart_citizen_session: 'invalid-token' },
      params: { communityId },
    } as AdministrativeRequest;

    await expect(sessionGuard.canActivate(executionContext(invalidRequest))).rejects.toEqual(
      new UnauthorizedException('Your session is no longer valid.'),
    );
  });

  it('allows only the authenticated community without querying record existence', () => {
    const matchingRequest = {
      administrativeSession: session,
      params: { communityId },
    } as AdministrativeRequest;
    expect(communityGuard.canActivate(executionContext(matchingRequest))).toBe(true);

    const otherRequest = {
      administrativeSession: session,
      params: { communityId: otherCommunityId },
    } as AdministrativeRequest;
    expect(() => communityGuard.canActivate(executionContext(otherRequest))).toThrow(
      new ForbiddenException('You do not have access to this resource.'),
    );
  });

  it('uses explicit permissions and never grants access from a position name', () => {
    const readHandler = () => undefined;
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, ['finance.report.read'], readHandler);
    const request = {
      administrativeSession: session,
      params: { communityId },
    } as AdministrativeRequest;

    expect(permissionGuard.canActivate(executionContext(request, readHandler))).toBe(true);

    const approveHandler = () => undefined;
    Reflect.defineMetadata(REQUIRED_PERMISSIONS_KEY, ['finance.report.approve'], approveHandler);
    expect(() => permissionGuard.canActivate(executionContext(request, approveHandler))).toThrow(
      new ForbiddenException('You do not have access to this resource.'),
    );
  });
});
