import { hash } from 'argon2';

import { Argon2PasswordHasher } from './password-hasher';

describe('Argon2PasswordHasher', () => {
  const password = 'synthetic verification phrase';
  const hasher = new Argon2PasswordHasher();

  it('verifies a matching Argon2id value', async () => {
    const passwordHash = await hash(password);

    await expect(hasher.verify(passwordHash, password)).resolves.toBe(true);
  });

  it('rejects missing, malformed, and non-matching values', async () => {
    const passwordHash = await hash(password);

    await expect(hasher.verify(null, password)).resolves.toBe(false);
    await expect(hasher.verify('malformed-value', password)).resolves.toBe(false);
    await expect(hasher.verify(passwordHash, 'different synthetic phrase')).resolves.toBe(false);
  });
});
