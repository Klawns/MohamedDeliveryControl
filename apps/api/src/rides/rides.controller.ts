import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  UseGuards,
  Request,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RidesService } from './rides.service';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';
import { ZodBody, ZodQuery } from '../common/decorators/zod.decorator';
import {
  bulkDeleteRidesSchema,
  createRideSchema,
  updateRideSchema,
  updateRideStatusSchema,
  findAllRidesSchema,
  getStatsSchema,
} from './dto/rides.dto';
import type {
  BulkDeleteRidesDto,
  CreateRideDto,
  UpdateRideDto,
  UpdateRideStatusDto,
  FindAllRidesDto,
  GetStatsDto,
} from './dto/rides.dto';
import type { RequestWithUser } from '../auth/auth.types';
import { RideResponsePresenterService } from './services/ride-response-presenter.service';

@Controller('rides')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class RidesController {
  constructor(
    private readonly ridesService: RidesService,
    private readonly rideResponsePresenter: RideResponsePresenterService,
  ) {}

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @ZodQuery(findAllRidesSchema) query: FindAllRidesDto,
  ) {
    const { limit, cursor, ...filters } = query;
    const { rides, ...meta } = await this.ridesService.findAll(
      req.user.id,
      limit,
      cursor,
      filters,
    );

    return {
      data: await this.rideResponsePresenter.presentList(rides),
      meta,
    };
  }

  @Get('frequent-clients')
  getFrequentClients(@Request() req: RequestWithUser) {
    return this.ridesService.getFrequentClients(req.user.id);
  }

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @ZodBody(createRideSchema) body: CreateRideDto,
  ) {
    const result = await this.ridesService.create(req.user.id, body);
    return this.rideResponsePresenter.present(result);
  }

  @Post('bulk-delete')
  async bulkDelete(
    @Request() req: RequestWithUser,
    @ZodBody(bulkDeleteRidesSchema) body: BulkDeleteRidesDto,
  ) {
    return this.ridesService.bulkDelete(req.user.id, body);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @ZodBody(updateRideStatusSchema) body: UpdateRideStatusDto,
  ) {
    const result = await this.ridesService.updateStatus(req.user.id, id, body);
    return this.rideResponsePresenter.present(result);
  }

  @Get('stats')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  @Header('Pragma', 'no-cache')
  async getStats(
    @Request() req: RequestWithUser,
    @ZodQuery(getStatsSchema) query: GetStatsDto,
  ) {
    const result = await this.ridesService.getStats(req.user.id, query);

    return {
      data: await this.rideResponsePresenter.presentMappedList(result.rides),
      meta: {
        count: result.count,
        totalValue: result.totalValue,
      },
    };
  }

  @Get('count')
  async getCount(@Request() req: RequestWithUser) {
    const count = await this.ridesService.countAll(req.user.id);
    return { count };
  }

  @Get('client/:clientId')
  async findByClient(
    @Request() req: RequestWithUser,
    @Param('clientId') clientId: string,
    @ZodQuery(findAllRidesSchema) query: FindAllRidesDto,
  ) {
    const { limit, cursor, status, paymentStatus, startDate, endDate } = query;
    const { rides, ...meta } = await this.ridesService.findByClient(
      req.user.id,
      clientId,
      limit,
      cursor,
      {
        status,
        paymentStatus,
        startDate,
        endDate,
      },
    );

    return {
      data: await this.rideResponsePresenter.presentList(rides),
      meta,
    };
  }

  @Patch(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @ZodBody(updateRideSchema) body: UpdateRideDto,
  ) {
    const result = await this.ridesService.update(req.user.id, id, body);
    return this.rideResponsePresenter.present(result);
  }

  @Delete('all')
  deleteAll(@Request() req: RequestWithUser) {
    return this.ridesService.deleteAll(req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.ridesService.delete(req.user.id, id);
  }
}
