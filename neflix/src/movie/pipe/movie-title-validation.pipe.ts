import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class MoveTitleValidationPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      return value;
    }

    if (value.length <= 2) {
      throw new BadRequestException('제목 길이');
    }

    return value;
  }
}
