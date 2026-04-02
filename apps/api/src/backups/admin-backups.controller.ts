import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestWithUser } from '../auth/auth.types';
import { ZodParam } from '../common/decorators/zod.decorator';
import { BackupsService } from './backups.service';
import { backupJobIdParamSchema } from './dto/backups.dto';

@Controller('admin/backups')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminBackupsController {
  constructor(private readonly backupsService: BackupsService) {}

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
}
