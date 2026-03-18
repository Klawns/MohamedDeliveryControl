import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RidesService } from './rides.service';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';

@Controller('rides')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: 'PENDING' | 'COMPLETED' | 'CANCELLED',
    @Query('paymentStatus') paymentStatus?: 'PENDING' | 'PAID',
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.ridesService.findAll(
      req.user.id,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
      {
        status,
        paymentStatus,
        clientId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        search,
      },
    );
  }

  @Get('frequent-clients') // Repurposed for pinned clients
  async getFrequentClients(@Request() req: any) {
    return this.ridesService.getFrequentClients(req.user.id);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body()
    body: {
      clientId: string;
      value: number;
      location: string;
      notes?: string;
      photo?: string;
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      rideDate?: string;
    },
  ) {
    return this.ridesService.create(req.user.id, {
      ...body,
      rideDate: body.rideDate ? new Date(body.rideDate) : undefined,
    });
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
    },
  ) {
    return this.ridesService.updateStatus(req.user.id, id, body);
  }

  @Get('stats')
  async getStats(
    @Request() req: any,
    @Query('period') period: 'today' | 'week' | 'month' | 'year' | 'custom',
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('clientId') clientId?: string,
  ) {
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      const day = startDate.getDay();
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (start && end) {
      startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
    }

    return this.ridesService.getStats(
      req.user.id,
      startDate,
      endDate,
      clientId,
    );
  }

  @Get('count')
  async getCount(@Request() req: any) {
    const count = await this.ridesService.countAll(req.user.id);
    return { count };
  }

  @Get('client/:clientId')
  async findByClient(
    @Request() req: any,
    @Param('clientId') clientId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.ridesService.findByClient(
      req.user.id,
      clientId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body()
    body: {
      value?: number;
      location?: string;
      notes?: string;
      photo?: string;
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      paymentStatus?: 'PENDING' | 'PAID';
      rideDate?: string;
    },
  ) {
    return this.ridesService.update(req.user.id, id, {
      ...body,
      rideDate: body.rideDate ? new Date(body.rideDate) : undefined,
    });
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.ridesService.delete(req.user.id, id);
  }
}
