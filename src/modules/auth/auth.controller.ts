import { Body, Controller, Post, UnauthorizedException, Res, HttpStatus, Req, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const user = await this.authService.validateUsers(loginDto.identifier, loginDto.password);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const { access_token } = await this.authService.login(user);

        res.cookie('token', access_token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000
        });

        return { access_token }

    }


    @Post('logout')
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
        });
        return { message: 'Logged out successfully' };
    }

    @Get('check-auth')
    async checkAuth(@Req() req: Request) {
        const token = req.cookies['token'];
        if (!token) {
            throw new UnauthorizedException('Not Authenticated');
        }

        const isValid = await this.authService.verifyToken(token);
        if (!isValid) {
            throw new UnauthorizedException('Invalid token');
        }

        return { message: 'Authenticated' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getProfile(@Req() req){ 
        return this.authService.getProfile(req.user.sub);
    }
    
}




