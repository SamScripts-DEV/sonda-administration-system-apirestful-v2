import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ProfileGuard implements CanActivate {
    constructor(private prisma: PrismaService){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        console.log('ProfileGuard req.user antes:', req.user);
                
        if (req.user && req.user.sub && !req.user.permissions) {
            const user = await this.prisma.user.findUnique({
                where: { id: req.user.sub },
                include: {
                    areas: { include: { area: true } },
                    roles: {
                        include: {
                            role: {
                                include: {
                                    permissions: { include: { permission: true } }
                                }
                            }
                        }
                    },
                    roles_local: {
                        include: {
                            role: {
                                include: {
                                    permissions: { include: { permission: true } }
                                }
                            },
                            area: true
                        }
                    }
                }
            });
            if (user) {
                const globalPermissions = user.roles?.flatMap(r =>
                    r.role.permissions?.map(p => p.permission.code) ?? []
                ) ?? [];
                const localPermissions = user.roles_local?.flatMap(rl =>
                    rl.role.permissions?.map(p => p.permission.code) ?? []
                ) ?? [];
                req.user.permissions = Array.from(new Set([...globalPermissions, ...localPermissions]));
                req.user.areas = user.areas?.map(ua => ({ id: ua.area.id, name: ua.area.name })) ?? [];
                req.user.permissionsData = [
                    ...(user.roles?.flatMap(r => r.role.permissions?.map(p => ({
                        code: p.permission.code,
                        module: p.permission.module,
                        group: p.permission.group,
                        priority: p.permission.priority
                    })) ?? []) ?? []),
                    ...(user.roles_local?.flatMap(rl => rl.role.permissions?.map(p => ({
                        code: p.permission.code,
                        module: p.permission.module,
                        group: p.permission.group,
                        priority: p.permission.priority
                    })) ?? []) ?? [])
                ];
            }
        }
        return true;
    }
}