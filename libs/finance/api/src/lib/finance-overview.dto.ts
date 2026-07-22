import { ApiProperty } from '@nestjs/swagger';
import type { FinanceOverview } from '@smart-citizen/finance-contracts';

class LatestFinanceReportDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'date' })
  periodStart!: string;

  @ApiProperty({ format: 'date' })
  periodEnd!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  revisionNumber!: number;

  @ApiProperty({ enum: ['DRAFT', 'UNDER_REVIEW', 'APPROVED'] })
  workflowStage!: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED';

  @ApiProperty({ example: 'IDR', minLength: 3, maxLength: 3 })
  currency!: string;

  @ApiProperty({ example: '12500000', description: 'Exact amount in minor units.' })
  openingBalanceMinor!: string;

  @ApiProperty({ example: '3000000', description: 'Exact amount in minor units.' })
  incomeTotalMinor!: string;

  @ApiProperty({ example: '1750000', description: 'Exact amount in minor units.' })
  expenseTotalMinor!: string;

  @ApiProperty({ example: '13750000', description: 'Exact amount in minor units.' })
  closingBalanceMinor!: string;
}

export class FinanceOverviewDto implements FinanceOverview {
  @ApiProperty({ nullable: true, type: LatestFinanceReportDto })
  latestReport!: LatestFinanceReportDto | null;

  @ApiProperty({ example: 1, minimum: 0, nullable: true })
  approvalRequiredCount!: number | null;
}
