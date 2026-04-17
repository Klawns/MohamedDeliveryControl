import {
  Controller,
  Get,
  Put,
  Post,
  Request,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestWithUser } from '../auth/auth.types';
import { ZodBody, ZodParam } from '../common/decorators/zod.decorator';
import { BackupsService } from './backups.service';
import {
  backupJobIdParamSchema,
  updateSystemBackupSettingsSchema,
  type UpdateSystemBackupSettingsDto,
} from './dto/backups.dto';
import { SystemBackupAdminService } from './services/system-backup-admin.service';

@Controller('admin/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminBackupsController {
  constructor(
    private readonly backupsService: BackupsService,
    private readonly systemBackupAdminService: SystemBackupAdminService,
  ) {}

  @Get('technical')
  listTechnicalBackups() {
    return this.backupsService.listTechnicalBackups();
  }

  @Post('technical/manual')
  createManualTechnicalBackup(@Request() req: RequestWithUser) {
    return this.backupsService.createManualTechnicalBackup(req.user.id);
  }

  @Get('technical/:id/download')
  getTechnicalDownloadUrl(@ZodParam('id', backupJobIdParamSchema) id: string) {
    return this.backupsService.getTechnicalDownloadUrl(id);
  }

  @Get('technical/:id/file')
  async getTechnicalDownloadFile(
    @ZodParam('id', backupJobIdParamSchema) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.backupsService.getTechnicalDownloadFile(id);

    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );

    return new StreamableFile(file.stream);
  }

  @Get('system/settings')
  getSystemBackupSettings() {
    return this.systemBackupAdminService.getSettings();
  }

  @Put('system/settings')
  updateSystemBackupSettings(
    @ZodBody(updateSystemBackupSettingsSchema)
    body: UpdateSystemBackupSettingsDto,
  ) {
    return this.systemBackupAdminService.updateSettings(body);
  }
}
