import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from 'src/utils/password.util';
import { User } from '@prisma/client';
import * as jwt from 'jsonwebtoken'
import { UserWithRelationsDto } from '../users/types/users-types';

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
        const globalPermissions = user.roles?.flatMap(r =>
            r.role.permissions?.map(p => p.permission.code) ?? []
        ) ?? [];

        const localPermissions = user.roles_local?.flatMap(rl =>
            rl.role.permissions?.map(p => p.permission.code) ?? []
        ) ?? [];

        const allPermissions = Array.from(new Set([...globalPermissions, ...localPermissions]));

        const payload = {
            sub: user.id,
            email: user.email,
            areas: user.areas?.map(ua => ({
                id: ua.area.id,
                name: ua.area.name
            })) ?? [],
            roles: [
                ...(user.roles?.map(r => ({
                    id: r.role.id,
                    name: r.role.name,
                    scope: r.role.scope
                })) ?? []),
                ...(user.roles_local?.map(rl => ({
                    id: rl.role.id,
                    name: rl.role.name,
                    scope: rl.role.scope
                })) ?? [])
            ],
            permissions: allPermissions
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
}
