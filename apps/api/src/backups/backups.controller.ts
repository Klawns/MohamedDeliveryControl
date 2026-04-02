import {
  Controller,
  Get,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { RequestWithUser } from '../auth/auth.types';
import { ZodBody, ZodParam } from '../common/decorators/zod.decorator';
import { BackupsService } from './backups.service';
import {
  backupJobIdParamSchema,
  backupImportJobIdParamSchema,
  executeBackupImportSchema,
  type ExecuteBackupImportDto,
} from './dto/backups.dto';
import { DEFAULT_BACKUP_IMPORT_FILE_SIZE_LIMIT_BYTES } from './backups.constants';

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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: DEFAULT_BACKUP_IMPORT_FILE_SIZE_LIMIT_BYTES,
      },
      fileFilter: (req, file, cb) => {
        const looksLikeZip =
          file.mimetype === 'application/zip' ||
          file.mimetype === 'application/x-zip-compressed' ||
          file.originalname.toLowerCase().endsWith('.zip');

        if (!looksLikeZip) {
          return cb(
            new Error('Apenas arquivos .zip sao aceitos para importacao.'),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  previewImport(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.backupsService.previewFunctionalImport(req.user.id, file);
  }

  @Post('import/execute')
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
