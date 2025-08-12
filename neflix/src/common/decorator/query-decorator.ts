import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

//ExecutionContext는 NestJS에서 현재 실행 중인 요청의 컨텍스트를 나타내는 객체입니다.
export const QueryRunner = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();

  if (!request || !request.QueryRunner) {
    throw new InternalServerErrorException('QueryRunner is not available in the request context');
  }

  return request.QueryRunner;
});
