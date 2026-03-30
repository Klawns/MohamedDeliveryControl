import {
  Controller,
  Get,
  Header,
  Post,
  Patch,
  UseGuards,
  Request,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RidesService } from './rides.service';
import { RideMapper } from './mappers/ride.mapper';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';
import { ZodBody, ZodQuery } from '../common/decorators/zod.decorator';
import {
  createRideSchema,
  updateRideSchema,
  updateRideStatusSchema,
  findAllRidesSchema,
  getStatsSchema,
} from './dto/rides.dto';
import type {
  CreateRideDto,
  UpdateRideDto,
  UpdateRideStatusDto,
  FindAllRidesDto,
  GetStatsDto,
} from './dto/rides.dto';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('rides')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

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
      data: RideMapper.toHttpList(rides),
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
    return RideMapper.toHttp(result);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @ZodBody(updateRideStatusSchema) body: UpdateRideStatusDto,
  ) {
    const result = await this.ridesService.updateStatus(req.user.id, id, body);
    return RideMapper.toHttp(result);
  }

  @Get('stats')
  @Header('Cache-Control', 'private, no-store, max-age=0')
  @Header('Pragma', 'no-cache')
  getStats(
    @Request() req: RequestWithUser,
    @ZodQuery(getStatsSchema) query: GetStatsDto,
  ) {
    return this.ridesService.getStats(req.user.id, query);
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
    const { rides, ...meta } = await this.ridesService.findByClient(
      req.user.id,
      clientId,
      query.limit,
      query.cursor,
    );

    return {
      data: RideMapper.toHttpList(rides),
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
    return RideMapper.toHttp(result);
  }

  @Delete(':id')
  async delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    if (id === 'all') {
      return this.ridesService.deleteAll(req.user.id);
    }

    const result = await this.ridesService.delete(req.user.id, id);
    return result ? RideMapper.toHttp(result) : null;
  }
}
