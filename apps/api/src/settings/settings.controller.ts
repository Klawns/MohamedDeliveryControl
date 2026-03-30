import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettingsService } from './settings.service';
import { AuthService } from '../auth/auth.service';
import { ZodBody, ZodParam } from '../common/decorators/zod.decorator';
import {
  createRidePresetSchema,
  ridePresetIdParamSchema,
  updateRidePresetSchema,
} from './dto/settings.dto';
import type {
  CreateRidePresetDto,
  UpdateRidePresetDto,
} from './dto/settings.dto';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('settings')
@UseGuards(AuthGuard('jwt'))
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly authService: AuthService,
  ) {}

  @Patch('tutorial-seen')
  tutorialSeen(@Request() req: RequestWithUser) {
    return this.authService.tutorialSeen(req.user.id);
  }

  @Get('ride-presets')
  getRidePresets(@Request() req: RequestWithUser) {
    return this.settingsService.getRidePresets(req.user.id);
  }

  @Post('ride-presets')
  createRidePreset(
    @Request() req: RequestWithUser,
    @ZodBody(createRidePresetSchema) body: CreateRidePresetDto,
  ) {
    return this.settingsService.createRidePreset(req.user.id, body);
  }

  @Patch('ride-presets/:id')
  updateRidePreset(
    @Request() req: RequestWithUser,
    @ZodParam('id', ridePresetIdParamSchema) id: string,
    @ZodBody(updateRidePresetSchema) body: UpdateRidePresetDto,
  ) {
    return this.settingsService.updateRidePreset(req.user.id, id, body);
  }

  @Delete('ride-presets/:id')
  deleteRidePreset(
    @Request() req: RequestWithUser,
    @ZodParam('id', ridePresetIdParamSchema) id: string,
  ) {
    return this.settingsService.deleteRidePreset(req.user.id, id);
  }
}
