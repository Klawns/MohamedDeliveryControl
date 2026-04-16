import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';
import { ActiveSubscriptionGuard } from '../auth/guards/active-subscription.guard';
import { ZodBody, ZodQuery } from '../common/decorators/zod.decorator';
import * as Dtos from './dto/clients.dto';
import { ClientMapper } from './mappers/client.mapper';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('clients')
@UseGuards(AuthGuard('jwt'), ActiveSubscriptionGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
    @ZodQuery(Dtos.findAllClientsSchema) query: Dtos.FindAllClientsDto,
  ) {
    const { clients, ...meta } = await this.clientsService.findAll(
      req.user.id,
      query.limit,
      query.cursor,
      query.search,
    );

    return {
      data: ClientMapper.toHttpList(clients),
      meta,
    };
  }

  @Get('directory')
  async findDirectory(
    @Request() req: RequestWithUser,
    @ZodQuery(Dtos.getClientDirectorySchema) query: Dtos.GetClientDirectoryDto,
  ) {
    const { clients, ...meta } = await this.clientsService.findDirectory(
      req.user.id,
      query.search,
      query.limit,
    );

    return {
      data: ClientMapper.toHttpDirectoryList(clients),
      meta,
    };
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @ZodBody(Dtos.createClientSchema) body: Dtos.CreateClientBodyDto,
  ) {
    return this.clientsService.create(req.user.id, body);
  }

  @Post('bulk-delete')
  bulkDelete(
    @Request() req: RequestWithUser,
    @ZodBody(Dtos.bulkDeleteClientsSchema) body: Dtos.BulkDeleteClientsDto,
  ) {
    return this.clientsService.bulkDelete(req.user.id, body);
  }

  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @ZodBody(Dtos.updateClientSchema) body: Dtos.UpdateClientBodyDto,
  ) {
    return this.clientsService.update(req.user.id, id, body);
  }

  @Delete(':id')
  delete(@Request() req: RequestWithUser, @Param('id') id: string) {
    if (id === 'all') {
      return this.clientsService.deleteAll(req.user.id);
    }

    return this.clientsService.delete(req.user.id, id);
  }

  @Get(':id/balance')
  getBalance(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.clientsService.getClientBalance(req.user.id, id);
  }

  @Post(':id/payments')
  addPartialPayment(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @ZodBody(Dtos.addPartialPaymentSchema) body: Dtos.AddPartialPaymentDto,
  ) {
    return this.clientsService.addPartialPayment(
      req.user.id,
      id,
      body.amount,
      body.notes,
    );
  }

  @Get(':id/payments')
  getPayments(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @ZodQuery(Dtos.getClientPaymentsSchema) query: Dtos.GetClientPaymentsDto,
  ) {
    return this.clientsService.getClientPayments(req.user.id, id, query.status);
  }

  @Post(':id/close-debt')
  closeDebt(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.clientsService.closeDebt(req.user.id, id);
  }
}
