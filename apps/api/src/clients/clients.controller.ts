import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';
import { ZodBody, ZodQuery } from '../common/decorators/zod.decorator';
import * as Dtos from './dto/clients.dto';
import { ClientMapper } from './mappers/client.mapper';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get()
  async findAll(@Request() req: any, @ZodQuery(Dtos.findAllClientsSchema) query: Dtos.FindAllClientsDto) {
    const { clients, ...meta } = await this.clientsService.findAll(
      req.user.id,
      query.limit,
      query.cursor,
      query.search,
    );
    
    return { 
      data: ClientMapper.toHttpList(clients), 
      meta 
    };
  }

  @Post()
  async create(@Request() req: any, @ZodBody(Dtos.createClientSchema) body: Dtos.CreateClientBodyDto) {
    return this.clientsService.create(req.user.id, body);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @ZodBody(Dtos.updateClientSchema) body: Dtos.UpdateClientBodyDto,
  ) {
    return this.clientsService.update(req.user.id, id, body);
  }

  @Delete(':id')
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.clientsService.delete(req.user.id, id);
  }

  @Get(':id/balance')
  async getBalance(@Request() req: any, @Param('id') id: string) {
    return this.clientsService.getClientBalance(req.user.id, id);
  }

  @Post(':id/payments')
  async addPartialPayment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { amount: number; notes?: string },
  ) {
    return this.clientsService.addPartialPayment(
      req.user.id,
      id,
      body.amount,
      body.notes,
    );
  }

  @Get(':id/payments')
  async getPayments(
    @Request() req: any,
    @Param('id') id: string,
    @Query('status') status?: 'UNUSED' | 'USED',
  ) {
    return this.clientsService.getClientPayments(req.user.id, id, status);
  }

  @Post(':id/close-debt')
  async closeDebt(@Request() req: any, @Param('id') id: string) {
    return this.clientsService.closeDebt(req.user.id, id);
  }
}
