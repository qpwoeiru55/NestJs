import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  parseBasicToken(rawToken: string) {
    //['Basic', $token]
    const basicSplit = rawToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷에러');
    }

    const [_, token] = basicSplit;

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

  register(rawToken: string) {
    throw new Error('Method not implemented.');
  }
}
