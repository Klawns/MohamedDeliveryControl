import { Controller, Get, Header, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FinanceService } from './finance.service';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';
import { ZodQuery } from '../common/decorators/zod.decorator';
import { getFinanceStatsSchema } from './dto/finance.dto';
import type { GetFinanceStatsDto } from './dto/finance.dto';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  @Header('Pragma', 'no-cache')
  getDashboard(
    @Request() req: RequestWithUser,
    @ZodQuery(getFinanceStatsSchema) query: GetFinanceStatsDto,
  ) {
    return this.financeService.getDashboard(req.user.id, query);
  }
}
