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
  UsePipes,
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

@Controller('rides')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class RidesController {
  constructor(private ridesService: RidesService) {}

  @Get()
  async findAll(@Request() req: any, @ZodQuery(findAllRidesSchema) query: FindAllRidesDto) {
    const { limit, cursor, ...filters } = query;
    const { rides, ...meta } = await this.ridesService.findAll(req.user.id, limit, cursor, filters);
    
    return {
      data: RideMapper.toHttpList(rides),
      meta,
    };
  }

  @Get('frequent-clients')
  async getFrequentClients(@Request() req: any) {
    return this.ridesService.getFrequentClients(req.user.id);
  }

  @Post()
  async create(@Request() req: any, @ZodBody(createRideSchema) body: CreateRideDto) {
    const result = await this.ridesService.create(req.user.id, body);
    return RideMapper.toHttp(result);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @ZodBody(updateRideStatusSchema) body: UpdateRideStatusDto,
  ) {
    const result = await this.ridesService.updateStatus(req.user.id, id, body);
    return RideMapper.toHttp(result);
  }

  @Get('stats')
  async getStats(@Request() req: any, @ZodQuery(getStatsSchema) query: GetStatsDto) {
    return this.ridesService.getStats(req.user.id, query);
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
    @Query('cursor') cursor?: string,
  ) {
    const { rides, ...meta } = await this.ridesService.findByClient(
      req.user.id,
      clientId,
      limit ? Number(limit) : undefined,
      cursor,
    );
    
    return {
      data: RideMapper.toHttpList(rides),
      meta,
    };
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @ZodBody(updateRideSchema) body: UpdateRideDto,
  ) {
    const result = await this.ridesService.update(req.user.id, id, body);
    return RideMapper.toHttp(result);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    const result = await this.ridesService.delete(req.user.id, id);
    return result ? RideMapper.toHttp(result) : null;
  }
}
