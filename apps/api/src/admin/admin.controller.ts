import {
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  Delete,
  Param,
  Put,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('users/recent')
  async getRecentUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.adminService.getRecentUsers(Number(page), Number(limit));
  }

  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @Post('users')
  async createUser(@Body() data: any) {
    return this.adminService.createUser(data);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @HttpCode(HttpStatus.OK)
  @Put('users/:id/plan')
  async updateUserPlan(
    @Param('id') id: string,
    @Body('plan') plan: 'starter' | 'premium' | 'lifetime',
  ) {
    return this.adminService.updateUserPlan(id, plan);
  }

  @Get('settings/plans')
  async getPlans() {
    return this.adminService.getPlans();
  }

  @HttpCode(HttpStatus.OK)
  @Put('settings/plans/:id')
  async updatePlanPut(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePlan(id, data);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('settings/plans/:id')
  async updatePlanPatch(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updatePlan(id, data);
  }
}
