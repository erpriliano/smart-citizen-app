import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { SessionContext, SignInInput } from '@smart-citizen/identity-contracts';

export class SignInDto implements SignInInput {
  @ApiProperty({ format: 'email', example: 'officer@example.test' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ format: 'password', minLength: 8, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class SessionUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'email' })
  email!: string;
}

export class AssignmentSummaryDto {
  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;
}

export class SessionCommunityDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ example: 'Asia/Jakarta' })
  timezone!: string;

  @ApiProperty({ example: 'IDR' })
  currency!: string;
}

export class SessionContextDto implements SessionContext {
  @ApiProperty({ type: SessionUserDto })
  user!: SessionUserDto;

  @ApiProperty({ format: 'uuid' })
  membershipId!: string;

  @ApiProperty({ type: SessionCommunityDto })
  community!: SessionCommunityDto;

  @ApiProperty({ type: AssignmentSummaryDto, isArray: true })
  positions!: AssignmentSummaryDto[];

  @ApiProperty({ type: AssignmentSummaryDto, isArray: true })
  roles!: AssignmentSummaryDto[];

  @ApiProperty({ type: String, isArray: true })
  permissions!: string[];
}
