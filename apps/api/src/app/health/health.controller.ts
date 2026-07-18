import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

const healthResponse = {
  status: 'ok',
  service: 'smart-citizen-api',
} as const;

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'The API is available.',
    schema: { example: healthResponse },
  })
  getHealth(): typeof healthResponse {
    return healthResponse;
  }
}
