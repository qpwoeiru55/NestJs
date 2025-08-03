import { Injectable } from '@nestjs/common';
import { AuthGuard, PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

export class LocalAuthGuard extends AuthGuard('jin') {}

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'jin') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  /**
   *
   * validate : username, password
   *
   * return -> Request();
   */
  async validate(email: string, password: string) {
    const user = await this.authService.ahthenticate(email, password);

    return user;
  }
}
