import { Controller, Get, Post, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { AdminSettingsService } from './admin-settings.service';
import { ZodBody, ZodParam } from '../common/decorators/zod.decorator';
import {
  adminEntityIdParamSchema,
  updatePricingPlanSchema,
  updateConfigSchema,
  createCouponSchema,
} from './dto/admin.dto';
import type {
  AdminEntityIdParamDto,
  UpdatePricingPlanDto,
  UpdateConfigDto,
  CreateCouponDto,
} from './dto/admin.dto';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get('plans')
  async getPlans() {
    return this.settingsService.getPlans();
  }

  @Patch('plans/:id')
  async updatePlan(
    @ZodParam('id', adminEntityIdParamSchema) id: AdminEntityIdParamDto,
    @ZodBody(updatePricingPlanSchema) data: UpdatePricingPlanDto,
  ) {
    return this.settingsService.updatePlan(id, data);
  }

  @Get('configs')
  async getConfigs() {
    return this.settingsService.getConfigs();
  }

  @Post('configs')
  async updateConfig(@ZodBody(updateConfigSchema) body: UpdateConfigDto) {
    return this.settingsService.updateConfig(
      body.key,
      body.value,
      body.description,
    );
  }

  @Get('promo-codes')
  async listCoupons() {
    return this.settingsService.listCoupons();
  }

  @Post('promo-codes')
  async createCoupon(@ZodBody(createCouponSchema) data: CreateCouponDto) {
    return this.settingsService.createCoupon(data);
  }

  @Public()
  @Post('seed')
  async seed() {
    await this.settingsService.seedInitialData();
    return { message: 'Initial data seeded' };
  }
}
