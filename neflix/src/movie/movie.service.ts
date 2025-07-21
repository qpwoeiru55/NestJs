import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies: Movie[] = [];

  private idCounter = 3;

  constructor() {
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = '해리';
    movie1.genre = 'fan';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '반지';
    movie2.genre = 'fan2';

    this.movies.push(movie1, movie2);
  }

  getManyMovies(title?: string) {
    if (!title) {
      return this.movies;
    } else {
      return this.movies.filter((m) => m.title.startsWith(title));
    }
  }

  getMovieById(id: number) {
    const movie = this.movies.find((m) => m.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto) {
    const movie: Movie = {
      id: this.idCounter++,
      ...createMovieDto,
    };

    this.movies.push(movie);

    return movie;
  }

  updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = this.movies.find((m) => m.id === +id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    Object.assign(movie, updateMovieDto);

    return movie;
  }

  deleteMovie(id: number) {
    const movieIndex = this.movies.findIndex((m) => m.id === +id);

    if (movieIndex === -1) {
      throw new NotFoundException('존재하지 않는 id의 영화');
    }
    this.movies.splice(movieIndex, 1);

    return id;
  }
}
