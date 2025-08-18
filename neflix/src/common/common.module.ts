import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { TaskService } from './task.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from 'src/movie/entity/movie.entity';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'temp'),
        filename: (req, file, callback) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';
          if (split.length > 1) {
            extension = split[split.length - 1];
          }

          callback(null, `${v4()}_${Date.now()}.${extension}`); // 파일 이름을 UUID로 설정
        },
      }),
    }),
    TypeOrmModule.forFeature([Movie]),
  ],
  controllers: [CommonController],
  providers: [CommonService, TaskService],
  exports: [CommonService],
})
export class CommonModule {}
