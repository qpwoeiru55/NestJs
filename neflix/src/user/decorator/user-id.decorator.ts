import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

//ExecutionContext는 NestJS에서 현재 실행 중인 요청의 컨텍스트를 나타내는 객체입니다.
export const UserId = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();

  // if (!request.user || !request.user.sub || !request) {
  //   throw new UnauthorizedException('User ID not found in request');
  // }

  return request?.user?.sub; // request.user.sub는 JWT 토큰에서 추출된 사용자 ID입니다.
});
