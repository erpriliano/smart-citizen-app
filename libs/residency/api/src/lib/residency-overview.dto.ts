import { ApiProperty } from '@nestjs/swagger';
import type { ResidencyOverview } from '@smart-citizen/residency-contracts';

class ResidencyRecordOverviewDto {
  @ApiProperty({ example: 24, minimum: 0 })
  activeHouseCount!: number;

  @ApiProperty({ example: 21, minimum: 0 })
  occupiedHouseCount!: number;

  @ApiProperty({ example: 73, minimum: 0 })
  currentResidentCount!: number;
}

class ResidencyChangeActivityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['MOVE_IN', 'MOVE_OUT', 'CORRECTION'] })
  changeType!: 'MOVE_IN' | 'MOVE_OUT' | 'CORRECTION';

  @ApiProperty({ enum: ['SUBMITTED', 'APPROVED', 'REJECTED', 'APPLIED'] })
  workflowStage!: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'APPLIED';

  @ApiProperty({ format: 'date-time' })
  submittedDateTime!: string;

  @ApiProperty({ format: 'date-time' })
  updatedDateTime!: string;
}

class ResidencyChangeOverviewDto {
  @ApiProperty({ example: 2, minimum: 0 })
  pendingCount!: number;

  @ApiProperty({ isArray: true, type: ResidencyChangeActivityDto })
  recent!: ResidencyChangeActivityDto[];
}

export class ResidencyOverviewDto implements ResidencyOverview {
  @ApiProperty({ nullable: true, type: ResidencyRecordOverviewDto })
  records!: ResidencyRecordOverviewDto | null;

  @ApiProperty({ nullable: true, type: ResidencyChangeOverviewDto })
  changes!: ResidencyChangeOverviewDto | null;
}
