import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';
import { ZodQuery } from '../common/decorators/zod.decorator';
import { getFinanceStatsSchema } from './dto/finance.dto';
import type { GetFinanceStatsDto } from './dto/finance.dto';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  async getDashboard(
    @Request() req: any,
    @ZodQuery(getFinanceStatsSchema) query: GetFinanceStatsDto,
  ) {
    return this.financeService.getDashboard(req.user.id, query);
  }
}
