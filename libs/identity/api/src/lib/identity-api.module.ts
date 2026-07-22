import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Environment } from '@smart-citizen/shared-configuration';
import { DatabaseModule } from '@smart-citizen/shared-database';

import { AdministrativeSessionGuard } from './administrative-session.guard';
import { CommunityScopeGuard } from './community-scope.guard';
import { IdentityAccountRepository } from './identity-account.repository';
import { IdentitySessionController } from './identity-session.controller';
import { IdentitySessionService } from './identity-session.service';
import { Argon2PasswordHasher, PasswordHasher } from './password-hasher';
import { PermissionGuard } from './permission.guard';
import { PrismaIdentityAccountRepository } from './prisma-identity-account.repository';
import { JwtSessionTokenService, SessionTokenService } from './session-token.service';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configuration: ConfigService<Environment, true>) => ({
        secret: configuration.get('AUTH_SESSION_SECRET', { infer: true }),
        signOptions: {
          expiresIn: configuration.get('AUTH_SESSION_TTL_SECONDS', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [IdentitySessionController],
  providers: [
    IdentitySessionService,
    AdministrativeSessionGuard,
    CommunityScopeGuard,
    PermissionGuard,
    { provide: IdentityAccountRepository, useClass: PrismaIdentityAccountRepository },
    { provide: PasswordHasher, useClass: Argon2PasswordHasher },
    { provide: SessionTokenService, useClass: JwtSessionTokenService },
  ],
  exports: [
    IdentitySessionService,
    AdministrativeSessionGuard,
    CommunityScopeGuard,
    PermissionGuard,
  ],
})
export class IdentityApiModule {}
