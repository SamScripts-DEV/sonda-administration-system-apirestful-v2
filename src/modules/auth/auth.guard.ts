import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context) {
    console.log('err:', err);
    console.log('user:', user);
    console.log('info:', info)
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido o no enviado');
    }
    return user;
  }
}