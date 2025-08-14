import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TaskService {
  constructor() {}

  @Cron('* * * * * *')
  logEverySecond() {
    console.log('Logging every second');
  }
}
