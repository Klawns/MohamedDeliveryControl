import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { RequestWithUser } from '../auth/auth.types';
import { ZodBody, ZodParam } from '../common/decorators/zod.decorator';
import { BackupsService } from './backups.service';
import {
  backupJobIdParamSchema,
  backupImportJobIdParamSchema,
  executeBackupImportSchema,
  type ExecuteBackupImportDto,
} from './dto/backups.dto';
import { parseBackupImportUploadRequest } from './utils/backup-import-upload.util';

function getBackupImportTracker(req: RequestWithUser) {
  const userId = typeof req.user?.id === 'string' ? req.user.id : 'anonymous';
  const ip = typeof req.ip === 'string' ? req.ip : 'unknown';
  return `backup-import:${userId}:${ip}`;
}

@Controller('backups')
@UseGuards(AuthGuard('jwt'))
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Post('manual')
  createManualBackup(@Request() req: RequestWithUser) {
    return this.backupsService.createManualFunctionalBackup(req.user.id);
  }

  @Get()
  listBackups(@Request() req: RequestWithUser) {
    return this.backupsService.listUserBackups(req.user.id);
  }

  @Get('status')
  getBackupStatus() {
    return this.backupsService.getUserBackupStatus();
  }

  @Get(':id/download')
  getDownloadUrl(
    @Request() req: RequestWithUser,
    @ZodParam('id', backupJobIdParamSchema) id: string,
  ) {
    return this.backupsService.getDownloadUrl(req.user.id, id);
  }

  @Post('import/preview')
  @Throttle({
    default: {
      limit: 2,
      ttl: 60000,
      getTracker: getBackupImportTracker,
    },
  })
  async previewImport(@Request() req: RequestWithUser) {
    const upload = await parseBackupImportUploadRequest(req);

    return this.backupsService.previewFunctionalImport(req.user.id, upload);
  }

  @Post('import/execute')
  @Throttle({
    default: {
      limit: 2,
      ttl: 60000,
      getTracker: getBackupImportTracker,
    },
  })
  executeImport(
    @Request() req: RequestWithUser,
    @ZodBody(executeBackupImportSchema) body: ExecuteBackupImportDto,
  ) {
    return this.backupsService.executeFunctionalImport(
      req.user.id,
      body.importJobId,
    );
  }

  @Get('import/:id')
  getImportStatus(
    @Request() req: RequestWithUser,
    @ZodParam('id', backupImportJobIdParamSchema) id: string,
  ) {
    return this.backupsService.getFunctionalImportStatus(req.user.id, id);
  }
}
