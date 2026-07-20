import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Environment } from '@smart-citizen/shared-configuration';
import type { CookieOptions, Request, Response } from 'express';

import {
  IdentitySessionService,
  InvalidCredentialsError,
  InvalidSessionError,
} from './identity-session.service';
import { SessionContextDto, SignInDto } from './session.dto';

export const IDENTITY_SESSION_COOKIE = 'smart_citizen_session';
const SESSION_COOKIE_PATH = '/api/v1';

@ApiTags('Identity')
@Controller('identity/session')
export class IdentitySessionController {
  constructor(
    private readonly sessions: IdentitySessionService,
    private readonly configuration: ConfigService<Environment, true>,
  ) {}

  @Post()
  @HttpCode(200)
  @ApiOkResponse({ type: SessionContextDto })
  @ApiBadRequestResponse({ description: 'The request did not pass validation.' })
  @ApiUnauthorizedResponse({ description: 'The credentials are not valid.' })
  async signIn(
    @Body() input: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionContextDto> {
    try {
      const result = await this.sessions.signIn(input);
      response.cookie(IDENTITY_SESSION_COOKIE, result.token, this.sessionCookieOptions());
      return result.session;
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        throw new UnauthorizedException('Email or password is incorrect.');
      }
      throw error;
    }
  }

  @Get()
  @ApiOkResponse({ type: SessionContextDto })
  @ApiUnauthorizedResponse({ description: 'The administrative session is not valid.' })
  async current(@Req() request: Request): Promise<SessionContextDto> {
    const token = request.cookies[IDENTITY_SESSION_COOKIE] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Your session is no longer valid.');
    }

    try {
      return await this.sessions.readSession(token);
    } catch (error) {
      if (error instanceof InvalidSessionError) {
        throw new UnauthorizedException('Your session is no longer valid.');
      }
      throw error;
    }
  }

  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'The administrative session was cleared.' })
  signOut(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(IDENTITY_SESSION_COOKIE, this.baseCookieOptions());
  }

  private sessionCookieOptions(): CookieOptions {
    return {
      ...this.baseCookieOptions(),
      maxAge: this.configuration.get('AUTH_SESSION_TTL_SECONDS', { infer: true }) * 1000,
    };
  }

  private baseCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configuration.get('AUTH_COOKIE_SECURE', { infer: true }),
      path: SESSION_COOKIE_PATH,
    };
  }
}
