import {
  Controller,
  Post,
  Headers,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
  UseGuards,
  Get,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthorizationDecorator } from './decorator/authorizationDecorator';

@Controller('auth')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiBasicAuth()
  @Post('register')
  registerUser(@AuthorizationDecorator() token: string) {
    return this.authService.register(token);
  }

  @Public()
  @ApiBasicAuth()
  @Post('login')
  loginUser(@AuthorizationDecorator() token: string) {
    return this.authService.login(token);
  }

  // @Post('token/access')
  // async rotateAccessToken(@Headers('authorization') token: string) {
  //   const payload = await this.authService.parseBearerToken(token, true);

  //   return {
  //     accessToken: await this.authService.issueToken(payload, false),
  //   };
  // }
  @Post('token/block')
  blockToken(@Body('token') token: string) {
    return this.authService.blockToken(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() req) {
    return {
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/pasport')
  async loginUserPassport(@Request() req) {
    return {
      refreshToken: await this.authService.issueToken(req.user, true),
      accessToken: await this.authService.issueToken(req.user, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() req) {
    return req.user;
  }
}
