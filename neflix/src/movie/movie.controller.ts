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
  Version,
  VERSION_NEUTRAL,
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
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CacheKey, CacheTTL, CacheInterceptor as CI } from '@nestjs/cache-manager';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

// @Controller({
//   path: 'movie',
//   version: '2',
// })
// export class MovieControllerV2 {
//   @Get()
//   getMovies() {
//     return [];
//   }
// }

// @Controller({
//   path: 'movie',
//   version: VERSION_NEUTRAL,
// })
@Controller('movie')
@ApiBearerAuth()
@ApiTags('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @Public()
  // @UseInterceptors(CacheInterceptor)
  @Throttle({ count: 5, unit: 'minute' })
  // @Version('5')
  @ApiOperation({ description: 'Get movies list 페이지네이션' })
  @ApiResponse({ status: 200, description: 'Success!!!!' })
  @ApiResponse({ status: 400, description: '페이지 네이션 데이터 잘못입력' })
  getMovies(@Query() dto: GetMovieDto, @UserId() userId?: number) {
    return this.movieService.getManyMovies(dto, userId);
  }

  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMoviesRecent')
  @CacheTTL(1000)
  getMoviesRecent() {
    return this.movieService.findRecent();
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
