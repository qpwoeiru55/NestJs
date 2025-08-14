import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Throttle } from '../decorator/throttle.decorator';

@Injectable()
export class ThrottleInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly reflector: Reflector
  ) {}
  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    //URL_USERID_MINUTE
    //VALUE -> COUNT
    const userId = request?.user?.sub;

    if (!userId) {
      return next.handle();
    }

    const throttleOptions = this.reflector.get<{ count: number; unit: 'minute' }>(
      Throttle,
      context.getHandler()
    );

    if (!throttleOptions) {
      return next.handle();
    }

    const date = new Date();
    const minute = date.getMinutes();

    const key = `${request.method}_${request.path}_${userId}_${minute}`;

    const count = await this.cacheManager.get<number>(key);

    console.log(key, count);

    if (count && count >= throttleOptions.count) {
      throw new ForbiddenException('너무 많은 요청입니다. 잠시 후 다시 시도해주세요.');
    }

    return next.handle().pipe(
      tap(async () => {
        const count = (await this.cacheManager.get<number>(key)) ?? 0;
        this.cacheManager.set(key, count + 1, 60000);
      })
    );
  }
}
