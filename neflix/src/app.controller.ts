import { Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { error } from 'console';

interface Movie {
  id: number;
  title: string;
}

@Controller('movie')
export class AppController {

  private movies: Movie[] = [
    {
      id: 1,
      title: '해리',
    },
    {
      id: 2,
      title: '반지',
    }
  ];

  constructor(private readonly appService: AppService) { }

  @Get()
  getMovies() {
    return this.movies;
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    const movie = this.movies.find((m) => m.id === +id);

    if(!movie){
      throw new NotFoundException('존재하지 않는 id의 영화');
    }

    return movie;
  }

  @Post()
  postMovie() {
    return {
      id: 3,
      name: '어벤져스',
      character: ['아연맨', '캡틴'],
    }
  }

  @Patch(':id')
  patchMovie() {
    return {
      id: 3,
      name: '어벤져스',
      character: ['아연맨', '블랙'],
    };
  }

  @Delete(':id')
  deleteMoive() {
    return 3;
  }
}
