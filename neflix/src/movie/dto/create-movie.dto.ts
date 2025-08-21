import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '영화의 제목', example: 'Inception' })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: '영화의 상세 설명', example: 'A mind-bending thriller' })
  detail: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({ description: '감독의 ID', example: 1 })
  directorId: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  @ApiProperty({ description: '장르 ID 목록', example: [1, 2, 3] })
  genreIds: number[];

  @IsString()
  @ApiProperty({ description: '영화 파일 이름', example: 'inception.mp4' })
  movieFileName: string;
}
