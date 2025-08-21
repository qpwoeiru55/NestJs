import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('common')
@ApiBearerAuth()
@ApiTags('common')
export class CommonController {
  @Post('vedio')
  @UseInterceptors(
    FileInterceptor('vedio', {
      limits: {
        fileSize: 1024 * 1024 * 100, // 100MB
      },
      fileFilter: (req, file, callback) => {
        console.log(file);
        if (file.mimetype !== 'video/mp4') {
          return callback(new BadRequestException('mp4만 가능'), false);
        }

        return callback(null, true); // 모든 파일을 허용
      },
    })
  )
  createVedio(
    @UploadedFile()
    movie: Express.Multer.File
  ) {
    return {
      fileName: movie.filename,
    };
  }
}
