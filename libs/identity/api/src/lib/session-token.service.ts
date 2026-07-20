import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { z } from 'zod';

const sessionTokenClaimsSchema = z
  .object({
    sub: z.uuid(),
    membershipId: z.uuid(),
    communityId: z.uuid(),
  })
  .passthrough();

export type SessionTokenClaims = Pick<
  z.infer<typeof sessionTokenClaimsSchema>,
  'sub' | 'membershipId' | 'communityId'
>;

export abstract class SessionTokenService {
  abstract sign(claims: SessionTokenClaims): Promise<string>;
  abstract verify(token: string): Promise<SessionTokenClaims>;
}

@Injectable()
export class JwtSessionTokenService extends SessionTokenService {
  constructor(private readonly jwt: JwtService) {
    super();
  }

  async sign(claims: SessionTokenClaims): Promise<string> {
    return this.jwt.signAsync(claims);
  }

  async verify(token: string): Promise<SessionTokenClaims> {
    return sessionTokenClaimsSchema.parse(
      await this.jwt.verifyAsync<Record<string, unknown>>(token),
    );
  }
}
