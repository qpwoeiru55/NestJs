import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envVariableKeys } from 'src/common/const/env.const';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 요청 헤더에서 토큰 추출
      ignoreExpiration: false, // 만료된 토큰은 거부
      secretOrKey: configService.get<string>(envVariableKeys.accessTokenSecret) as string, // 서명 검증용 키
    });
  }

  validate(payload: any) {
    return payload;
  }
}
