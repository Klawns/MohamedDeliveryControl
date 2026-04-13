import {
  Controller,
  HttpStatus,
  Logger,
  ParseFilePipeBuilder,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import type { RequestWithUser } from '../auth/auth.types';
import {
  UPLOAD_IMAGE_FILE_TYPE_PATTERN,
  UPLOAD_IMAGE_MAX_SIZE_BYTES,
} from './upload-image.constants';
import { UploadService } from './upload.service';

const uploadImageValidationPipe = new ParseFilePipeBuilder()
  .addMaxSizeValidator({ maxSize: UPLOAD_IMAGE_MAX_SIZE_BYTES })
  .addFileTypeValidator({ fileType: UPLOAD_IMAGE_FILE_TYPE_PATTERN })
  .build({
    fileIsRequired: true,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

@Controller('upload')
@UseGuards(AuthGuard('jwt'))
export class UploadController {
  private readonly logger = new Logger(UploadController.name);
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: {
        fileSize: UPLOAD_IMAGE_MAX_SIZE_BYTES,
      },
    }),
  )
  async uploadImage(
    @Request() req: RequestWithUser,
    @UploadedFile(uploadImageValidationPipe) file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    this.logger.log(
      `UPLOAD ENDPOINT HIT - File: ${file?.originalname || 'undefined'}`,
    );
    return this.uploadService.uploadImage(file, req.user.id, folder);
  }
}
