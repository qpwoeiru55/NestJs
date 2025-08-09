import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>
  ): Observable<any> | Promise<Observable<any>> {
    // 이건 NestJS의 인터셉터가 요청을 가로채고 응답을 처리하는 메서드입니다.
    const request = context.switchToHttp().getRequest();

    // GET /movie
    const key = `${request.method}-${request.path}`;

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap((response) => {
        this.cache.set(key, response);
      })
    );
  }
}
