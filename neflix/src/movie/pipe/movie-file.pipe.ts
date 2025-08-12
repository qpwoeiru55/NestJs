import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { v4 } from 'uuid';
import { rename } from 'fs/promises';
import { join } from 'path';

@Injectable()
export class MovieFilePipe
  implements PipeTransform<Express.Multer.File, Promise<Express.Multer.File>>
{
  constructor(
    private readonly options: {
      maxSize: number;
      mimeTypes: string;
    }
  ) {}

  async transform(
    value: Express.Multer.File,
    metadata: ArgumentMetadata
  ): Promise<Express.Multer.File> {
    if (!value) {
      throw new BadRequestException('movie 필드가 필요합니다.');
    }
    const byteSize = this.options.maxSize * 1024 * 1024; // MB to bytes

    if (value.size > byteSize) {
      throw new BadRequestException(`파일 크기는 ${this.options.maxSize}MB를 초과할 수 없습니다.`);
    }

    if (value.mimetype !== this.options.mimeTypes) {
      throw new BadRequestException(
        `지원하지 않는 파일 형식입니다. ${this.options.mimeTypes} 형식만 허용됩니다.`
      );
    }

    const split = value.originalname.split('.');

    let extension = 'mp4';
    if (split.length > 1) {
      extension = split[split.length - 1];
    }

    const filenmae = `${v4()}_${Date.now()}.${extension}`; // UUID와 현재 시간을 조합하여 파일 이름 생성
    const newPath = join(value.destination, filenmae); // 새 파일 경로 생성

    await rename(value.path, newPath); // 파일 이름 변경

    return {
      ...value,
      filename: filenmae,
    };
  }
}
