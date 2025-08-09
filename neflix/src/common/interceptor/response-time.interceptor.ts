import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ResponseTimeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const reqTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        // 이건 RxJS의 tap 연산자를 사용하여 응답이 완료된 후에 실행되는 콜백을 정의합니다.
        const resTime = Date.now();
        const diff = resTime - reqTime;

        console.log(`Response time for ${req.method} ${req.path}: ${diff}ms`);
      })
    );
  }
}
