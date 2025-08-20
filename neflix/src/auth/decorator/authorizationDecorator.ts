import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AuthorizationDecorator = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.headers['authorization'];
  }
);
