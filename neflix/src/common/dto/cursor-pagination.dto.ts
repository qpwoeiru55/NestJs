import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '페이지 네이션 커서',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjJ9LCJvcmRlciI6WyJpZF9ERVNDIl19',
  })
  cursor?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }): string[] => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: '정렬 기준',
    example: ['id_DESC'],
  })
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터 수',
    example: 5,
  })
  take: number = 5;
}
