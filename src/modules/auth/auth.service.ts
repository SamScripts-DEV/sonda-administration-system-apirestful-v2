import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from 'src/utils/password.util';
import { User } from '@prisma/client';
import * as jwt from 'jsonwebtoken'
import { UserWithRelationsDto } from '../users/types/users-types';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly jwtService: JwtService,
        private readonly userService: UsersService,
    ) { }

    async validateUsers(identifier: string, password: string) {
        const user = await this.userService.findOneByUsernameOrEmail(identifier);
        if (!user) throw new UnauthorizedException('Invalid credentials');

        const pass = await verifyPassword(user.passwordHash, password)
        if (!pass) throw new UnauthorizedException('Invalid credentials');
        return user;
    }

    async login(user: any) {
        const payload = {
            sub: user.id,
            email: user.email,
        };

        return { access_token: this.jwtService.sign(payload, { expiresIn: '8h' }) };
    }

    async verifyToken(token: string): Promise<boolean> {
        try {
            const secret = process.env.JWT_SECRET;
            if (!secret) throw new Error('JWT_SECRET is not defined in environment variables');
            const decoded = jwt.verify(token, secret);
            return !!decoded
        } catch (error) {
            return false

        }
    }

    decodeToken(token: string) {
        return this.jwtService.decode(token);
    }


    async getProfile(userId: string) {
        return this.userService.findProfilePayload(userId)
    }





}
