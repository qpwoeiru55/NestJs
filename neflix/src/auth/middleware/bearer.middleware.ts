import {
  BadRequestException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { envVariableKeys } from 'src/common/const/env.const';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class bearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    /// Basic $token
    /// Bearer $token
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const token = this.validateBearerToken(authHeader);

    const blockedToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);

    if (blockedToken) {
      throw new UnauthorizedException('차단된 토큰입니다');
    }

    const cachedPayload = await this.cacheManager.get(`TOKEN_${token}`);

    if (cachedPayload) {
      console.log('캐시에서 토큰 정보 조회:', cachedPayload);
      req.user = cachedPayload;
      next();
      return;
    }

    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰');
    }

    try {
      const secretKey =
        decodedPayload.type === 'refresh'
          ? envVariableKeys.refreshTokenSecret
          : envVariableKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      const expiryDate = +new Date(payload['exp'] * 1000);

      const now = +Date.now();

      const differenceInSeconds = (expiryDate - now) / 1000;

      await this.cacheManager.set(
        `TOKEN_${token}`,
        payload,
        Math.max((differenceInSeconds - 30) * 1000, 1)
      );

      req.user = payload;

      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료되었습니다');
      }
      next();
    }
  }

  validateBearerToken(rawToken: string) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷에러');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷에러');
    }

    return token;
  }
}
