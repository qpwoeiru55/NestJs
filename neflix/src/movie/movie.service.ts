import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>
  ) {}

  async getManyMovies(title?: string) {
    if (!title) {
      return [await this.movieRepository.find(), await this.movieRepository.count()];
    }

    return this.movieRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
    });
  }

  async getMovieById(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const movie = await this.movieRepository.save({
      ...createMovieDto,
      runtime: 100,
    });

    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    await this.movieRepository.update({ id }, updateMovieDto);

    const newmovie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    return newmovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {
        id,
      },
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    await this.movieRepository.delete(id);

    return id;
  }
}
