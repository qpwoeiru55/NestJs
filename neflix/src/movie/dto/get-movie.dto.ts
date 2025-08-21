import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CursorPaginationDto } from 'src/common/dto/cursor-pagination.dto';

// export class GetMovieDto extends PagePaginationDto {
export class GetMovieDto extends CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({ description: '영화의 제목', example: 'Inception' })
  title?: string;
}
