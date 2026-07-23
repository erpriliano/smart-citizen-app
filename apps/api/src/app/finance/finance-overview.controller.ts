import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FinanceOverviewDto, FinanceOverviewService } from '@smart-citizen/finance-api';
import type { SessionContext } from '@smart-citizen/identity-contracts';
import {
  AdministrativeSessionGuard,
  CommunityScopeGuard,
  CurrentSession,
  PermissionGuard,
  RequireAllPermissions,
} from '@smart-citizen/identity-api';

@ApiTags('Finance')
@Controller()
@UseGuards(AdministrativeSessionGuard, CommunityScopeGuard, PermissionGuard)
export class FinanceOverviewController {
  constructor(private readonly overview: FinanceOverviewService) {}

  @Get('communities/:communityId/finance/overview')
  @RequireAllPermissions('finance.report.read')
  @ApiOkResponse({ type: FinanceOverviewDto })
  @ApiUnauthorizedResponse({ description: 'The administrative session is not valid.' })
  @ApiForbiddenResponse({ description: 'The actor cannot access this community or summary.' })
  getOverview(
    @Param('communityId', new ParseUUIDPipe()) communityId: string,
    @CurrentSession() session: SessionContext,
  ): Promise<FinanceOverviewDto> {
    return this.overview.getOverview(session, communityId);
  }
}
