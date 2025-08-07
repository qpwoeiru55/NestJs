import { IsArray, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }): string[] => (Array.isArray(value) ? value : [value]))
  order: string[] = ['id_DESC'];

  @IsOptional()
  take: number = 5;
}
