import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';

export abstract class PasswordHasher {
  abstract verify(passwordHash: string | null, password: string): Promise<boolean>;
}

@Injectable()
export class Argon2PasswordHasher extends PasswordHasher {
  private readonly fallbackHash = hash(randomBytes(32), { type: argon2id });

  async verify(passwordHash: string | null, password: string): Promise<boolean> {
    const comparisonHash = passwordHash ?? (await this.fallbackHash);

    try {
      const matches = await verify(comparisonHash, password);
      return passwordHash !== null && matches;
    } catch {
      return false;
    }
  }
}
