import {
  Controller,
  Get,
  Post,
  UseGuards,
  Delete,
  Put,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import {
  ZodBody,
  ZodParam,
  ZodQuery,
} from '../common/decorators/zod.decorator';
import {
  adminEntityIdParamSchema,
  createUserSchema,
  adminUpdateUserPlanSchema,
  recentUsersQuerySchema,
  updatePricingPlanSchema,
} from './dto/admin.dto';
import type {
  AdminEntityIdParamDto,
  CreateUserDto,
  AdminUpdateUserPlanDto,
  RecentUsersQueryDto,
  UpdatePricingPlanDto,
} from './dto/admin.dto';

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
    @ZodQuery(recentUsersQuerySchema) query: RecentUsersQueryDto,
  ) {
    return this.adminService.getRecentUsers(query.page, query.limit);
  }

  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @Post('users')
  async createUser(@ZodBody(createUserSchema) body: CreateUserDto) {
    return this.adminService.createUser(body);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @ZodParam('id', adminEntityIdParamSchema) id: AdminEntityIdParamDto,
  ) {
    return this.adminService.deleteUser(id);
  }

  @HttpCode(HttpStatus.OK)
  @Put('users/:id/plan')
  async updateUserPlan(
    @ZodParam('id', adminEntityIdParamSchema) id: AdminEntityIdParamDto,
    @ZodBody(adminUpdateUserPlanSchema) body: AdminUpdateUserPlanDto,
  ) {
    return this.adminService.updateUserPlan(id, body.plan);
  }

  @Get('settings/plans')
  async getPlans() {
    return this.adminService.getPlans();
  }

  @HttpCode(HttpStatus.OK)
  @Put('settings/plans/:id')
  async updatePlanPut(
    @ZodParam('id', adminEntityIdParamSchema) id: AdminEntityIdParamDto,
    @ZodBody(updatePricingPlanSchema) body: UpdatePricingPlanDto,
  ) {
    return this.adminService.updatePlan(id, body);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('settings/plans/:id')
  async updatePlanPatch(
    @ZodParam('id', adminEntityIdParamSchema) id: AdminEntityIdParamDto,
    @ZodBody(updatePricingPlanSchema) body: UpdatePricingPlanDto,
  ) {
    return this.adminService.updatePlan(id, body);
  }
}
