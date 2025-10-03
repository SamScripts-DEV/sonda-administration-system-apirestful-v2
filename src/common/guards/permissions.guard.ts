import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { getEffectivePermissions } from "../utils/permission.util";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor (
        private reflector: Reflector,

    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.permissions) throw new ForbiddenException('No profile found for the user');

        // Calcula los permisos efectivos solo si no existen
        if (!user.effectivePermissions) {
            const effectivePermissions = getEffectivePermissions(user.permissionsData);
            request.user.effectivePermissions = effectivePermissions;
        }

        if (user.permissions.includes('system.full_access')) return true;

        const hasPermissions = requiredPermissions.some(p => user.permissions?.includes(p));
        if (!hasPermissions) throw new ForbiddenException('Insufficient permissions');
        return true;

      
    }
}