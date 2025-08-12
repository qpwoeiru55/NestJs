import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  Delete,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role, User } from 'src/user/entities/user.entity';
import { GetMovieDto } from './dto/get-movie.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transcation.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-decorator';
import { QueryRunner as QR } from 'typeorm';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  getMovies(@Query() dto: GetMovieDto) {
    return this.movieService.getManyMovies(dto);
  }

  @Get(':id')
  @Public()
  getMovie(@Param('id', ParseIntPipe) id: number) {
    return this.movieService.getMovieById(+id);
  }

  @Post()
  @UseInterceptors(TransactionInterceptor)
  @RBAC(Role.admin)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number
  ) {
    return this.movieService.createMovie(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(@Param('id', ParseIntPipe) id: string, @Body() body: UpdateMovieDto) {
    return this.movieService.updateMovie(+id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMoive(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.deleteMovie(+id);
  }

  @Post(':id/like')
  createMovieLike(@Param('id', ParseIntPipe) movieId: number, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  createMovieDislike(@Param('id', ParseIntPipe) movieId: number, @UserId() userId: number) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
