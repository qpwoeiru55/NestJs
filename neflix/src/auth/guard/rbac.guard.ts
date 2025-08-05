import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/user/entities/user.entity';
import { RBAC } from '../decorator/rbac.decorator';

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const role = this.reflector.get<Role>(RBAC, context.getHandler());

    // Role Enum에 정의된 역할인지 확인
    if (!Object.values(Role).includes(role)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // 사용자가 인증되지 않은 경우 접근 거부
    }

    return user.role <= role; // 사용자의 역할이 요청된 역할보다 낮거나 같은지 확인
  }
}
