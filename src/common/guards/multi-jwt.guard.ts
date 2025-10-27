import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

@Injectable()
export class MultiJwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();

   
        let token: string | undefined;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.replace('Bearer ', '');
        }

  
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) throw new UnauthorizedException('No token provided');


        const secrets = [
            process.env.JWT_SECRET,           
            process.env.JWT_SECRET_SONDA_CLOUD,     
        ].filter(Boolean) as string[];

        let payload: any = null;

        for (const secret of secrets) {
            try {
                payload = jwt.verify(token, secret);
                break;
            } catch (e) {}
        }

        if (!payload) throw new UnauthorizedException('Invalid token');
        req.user = payload;
        return true;
    }
}