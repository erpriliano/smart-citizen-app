import { randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';

import { JwtSessionTokenService, type SessionTokenClaims } from './session-token.service';

const claims: SessionTokenClaims = {
  sub: 'dd7a82c6-1fcc-4d79-82dc-14ad743015b5',
  membershipId: 'a2c8d45d-6cb8-4406-899c-0f54a64d40fd',
  communityId: '40db0b3f-0354-4f47-96df-bac69dc711a9',
};

describe('JwtSessionTokenService', () => {
  it('round-trips the three scoped session claims', async () => {
    const service = new JwtSessionTokenService(
      new JwtService({
        secret: randomBytes(32),
        signOptions: { expiresIn: 3600 },
      }),
    );

    const token = await service.sign(claims);

    await expect(service.verify(token)).resolves.toMatchObject(claims);
  });

  it('rejects malformed tenant claims even when the signature is valid', async () => {
    const jwt = new JwtService({ secret: randomBytes(32) });
    const service = new JwtSessionTokenService(jwt);
    const token = await jwt.signAsync({ ...claims, communityId: 'not-a-uuid' });

    await expect(service.verify(token)).rejects.toThrow();
  });
});
