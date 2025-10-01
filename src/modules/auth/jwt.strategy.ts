import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import {ExtractJwt, Strategy} from 'passport-jwt';
import { UsersService } from "../users/users.service";
import { request } from "express";



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly userService: UsersService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req, request) => {
                    const tokenFromCookie = req.cookies?.token;
                    const tokenFromHeader = req.headers.authorization?.split(' ')[1];
                    return tokenFromCookie || tokenFromHeader;
                }
            ]),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET
        })
    }

    async validate(payload: any) {
        
        const user = await this.userService.findOneById(payload.sub);
        if (!user) return null;
        return payload; 
    }
}