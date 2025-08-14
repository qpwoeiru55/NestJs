import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { envVariableKeys } from 'src/common/const/env.const';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache
  ) {}

  async blockToken(token: string) {
    const payload = this.jwtService.decode(token);

    const expiryDate = +new Date(payload['exp'] * 1000);

    const now = +Date.now();

    const differenceInSeconds = (expiryDate - now) / 1000;

    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(differenceInSeconds * 1000, 1)
    );

    return true;
  }

  parseBasicToken(rawToken: string) {
    //['Basic', $token]
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷에러');
    }

    const [baisc, token] = basicSplit;

    if (baisc.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷에러');
    }

    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    //email:password
    const tokenSplit = decoded.split(':');

    if (tokenSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷에러');
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    };
  }

  async parseBearerToken(rawToken: string, isRefreshToken: boolean) {
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷에러');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷에러');
    }

    const decodedPayload = this.jwtService.decode(token);

    if (decodedPayload.type !== 'refresh' && decodedPayload.type !== 'access') {
      throw new UnauthorizedException('잘못된 토큰');
    }
    const secretKey =
      decodedPayload.type === 'refresh'
        ? envVariableKeys.refreshTokenSecret
        : envVariableKeys.accessTokenSecret;

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get<string>(secretKey),
    });

    if (isRefreshToken) {
      if (payload.type !== 'refresh') {
        throw new BadRequestException('Refresh 토큰을 입력해주세요!');
      }
    } else {
      if (payload.type !== 'access') {
        throw new BadRequestException('Access 토큰을 입력해주세요!');
      }
    }

    return payload;
  }

  async register(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (user) {
      throw new BadRequestException('이미 가입자입니다');
    }

    const saltRounds = this.configService.get<number>(envVariableKeys.hasRounds);
    if (saltRounds === undefined) {
      throw new Error('HASH_ROUNDS 환경변수가 비어 있습니다.');
    }

    const hash = await bcrypt.hash(password, saltRounds);

    await this.userRepository.save({
      email,
      password: hash,
    });

    return this.userRepository.findOne({
      where: {
        email,
      },
    });
  }

  async ahthenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보');
    }

    return user;
  }

  async issueToken(user: { id: number; role: Role }, isRefreshToken: boolean) {
    const accessTokenSecret = this.configService.get<string>(envVariableKeys.accessTokenSecret);
    const refreshTokenSecret = this.configService.get<string>(envVariableKeys.refreshTokenSecret);

    return await this.jwtService.signAsync(
      {
        sub: user.id,
        role: user.role,
        type: isRefreshToken ? 'refresh' : 'access',
      },
      {
        secret: isRefreshToken ? refreshTokenSecret : accessTokenSecret,
        expiresIn: isRefreshToken ? '24h' : 300,
      }
    );
  }

  async login(rawToken: string) {
    const { email, password } = this.parseBasicToken(rawToken);

    const user = await this.ahthenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    };
  }
}
