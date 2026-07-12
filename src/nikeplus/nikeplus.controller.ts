import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NikePlusService } from './nikeplus.service';
import { NikePlusActivityResponseDto } from './dto/nikeplus-activity-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('nikeplus')
@ApiBearerAuth()
@Controller('nikeplus')
export class NikePlusController {
  constructor(private readonly nikePlusService: NikePlusService) {}

  @Get('activities')
  @ApiOperation({
    summary: 'List Nike+ activity stats for the authenticated user',
  })
  listActivities(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NikePlusActivityResponseDto[]> {
    return this.nikePlusService.listActivities(user.userId);
  }
}
