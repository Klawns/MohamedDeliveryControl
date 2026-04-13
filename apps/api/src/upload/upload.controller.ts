import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UploadService } from './upload.service';
import { Logger } from '@nestjs/common';
import type { RequestWithUser } from '../auth/auth.types';

@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Apenas imagens sao permitidas'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    this.logger.log(
      `UPLOAD ENDPOINT HIT - File: ${file?.originalname || 'undefined'}`,
    );
    return this.uploadService.uploadImage(file, req.user.id, folder);
  }
}
