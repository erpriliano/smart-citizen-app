import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import {
  AdministrativeSessionGuard,
  CommunityScopeGuard,
  CurrentSession,
} from '@smart-citizen/identity-api';
import { ResidencyOverviewDto, ResidencyOverviewService } from '@smart-citizen/residency-api';

@ApiTags('Residency')
@Controller()
@UseGuards(AdministrativeSessionGuard, CommunityScopeGuard)
export class ResidencyOverviewController {
  constructor(private readonly overview: ResidencyOverviewService) {}

  @Get('communities/:communityId/residency/overview')
  @ApiOkResponse({ type: ResidencyOverviewDto })
  @ApiUnauthorizedResponse({ description: 'The administrative session is not valid.' })
  @ApiForbiddenResponse({ description: 'The actor cannot access this community or summary.' })
  getOverview(
    @Param('communityId', new ParseUUIDPipe()) communityId: string,
    @CurrentSession() session: SessionContext,
  ): Promise<ResidencyOverviewDto> {
    return this.overview.getOverview(session, communityId);
  }
}
