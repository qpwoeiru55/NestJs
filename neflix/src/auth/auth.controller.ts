import { Controller, Post, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }
}
