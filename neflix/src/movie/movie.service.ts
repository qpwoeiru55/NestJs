import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitity/director.entity';
import { Genre } from 'src/genre/entitity/genre.entity';
import { GetMovieDto } from './dto/get-movie.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService
  ) {}

  async getManyMovies(dto: GetMovieDto) {
    // if (!title) {
    //   return [
    //     await this.movieRepository.find({
    //       relations: ['detail', 'director', 'genres'],
    //     }),
    //     await this.movieRepository.count(),
    //   ];
    // }

    // return this.movieRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });
    const { title } = dto;
    // const { page, take } = dto;

    const qb = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail');

    if (title) {
      qb.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    // page와 take가 모두 존재할 때만 적용
    // if (take && page) {
    //   this.commonService.aapplyPagination(qb, { page, take });
    // }

    const { nextCursor } = await this.commonService.applyCursorPagination(qb, dto);

    const [data, count] = await qb.getManyAndCount();

    return { data, nextCursor, count }; // 데이터와 다음 커서 반환
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository
      .createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id=:id', { id })
      .getOne();

    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director', 'genres'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화입니다');
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner) {
    const director = await qr.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 id 디렉터');
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(
        `존재하지 않는 장르가 잇다 -> ${genres.map((genre) => genre.id).join(',')}`
      );
    }

    const movieDetail = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({
        detail: createMovieDto.detail,
      })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await qr.manager
      .createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: { id: movieDetailId },
        director,
        creator: { id: userId },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await qr.manager
      .createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map((genre) => genre.id));

    // 파일을 temp 폴더에서 movie 폴더로 이동
    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName)
    );

    // const movie = await this.movieRepository.save({
    //   title: createMovieDto.title,
    //   detail: { detail: createMovieDto.detail },
    //   director,
    //   genres,
    // });

    return await qr.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {
          id,
        },
        relations: ['detail', 'director', 'genres'],
      });

      if (!movie) {
        throw new NotFoundException('존재하지 않는 id의 영화');
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let newDirector;

      if (directorId) {
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 id 디렉터');
        }

        newDirector = director;
      }

      let newGenres;

      if (genreIds) {
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(genreIds),
          },
        });

        if (genres.length !== genreIds.length) {
          throw new NotFoundException(
            `존재하지 않는 장르가 잇다-> ${genres.map((genre) => genre.id).join(',')}`
          );
        }
        newGenres = genres;
      }

      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector }),
      };

      await qr.manager
        .createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      // await this.movieRepository.update({ id }, movieUpdateFields);

      if (detail) {
        await qr.manager
          .createQueryBuilder()
          .update(MovieDetail)
          .set({
            detail,
          })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }
      // if (detail) {
      //   await this.movieDetailRepository.update(
      //     { id: movie.detail.id },
      //     {
      //       detail,
      //     }
      //   );
      // }

      if (newGenres) {
        await qr.manager
          .createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(
            newGenres.map((genre) => genre.id),
            movie.genres.map((genre) => genre.id)
          );
      }

      // const newmovie = await this.movieRepository.findOne({
      //   where: {
      //     id,
      //   },
      //   relations: ['detail', 'director'],
      // });

      // if (!newmovie) {
      //   throw new NotFoundException('존재하지 않는 id의 영화');
      // }

      // newmovie.genres = newGenres;

      // await this.movieRepository.save(newmovie);

      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    await this.movieRepository.createQueryBuilder().delete().where('id = :id', { id }).execute();

    // await this.movieRepository.delete(id);
    await this.movieDetailRepository.delete(movie.detail.id);

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId,
      },
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 id의 영화');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('존재하지 않는 id의 유저');
    }

    const likeRecord = await this.movieUserLikeRepository
      .createQueryBuilder('movieUserLike')
      .leftJoinAndSelect('movieUserLike.movie', 'movie')
      .leftJoinAndSelect('movieUserLike.user', 'user')
      .where('movieUserLike.movieId = :movieId', { movieId })
      .andWhere('movieUserLike.userId = :userId', { userId })
      .getOne();

    if (likeRecord) {
      if (likeRecord.isLike === isLike) {
        // 이미 같은 상태라면 삭제
        await this.movieUserLikeRepository.delete({
          movie: { id: movieId },
          user: { id: userId },
        });
      } else {
        // 상태가 다르면 업데이트
        await this.movieUserLikeRepository.update(
          { movie: { id: movieId }, user: { id: userId } },
          { isLike }
        );
      }
    } else {
      await this.movieUserLikeRepository.save({
        movie: { id: movieId },
        user: { id: userId },
        isLike,
      });
    }

    const result = await this.movieUserLikeRepository
      .createQueryBuilder('movieUserLike')
      .leftJoinAndSelect('movieUserLike.movie', 'movie')
      .leftJoinAndSelect('movieUserLike.user', 'user')
      .where('movieUserLike.movieId = :movieId', { movieId })
      .andWhere('movieUserLike.userId = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike,
    };
  }
}
