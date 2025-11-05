import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AreaRoleResponse } from './types/area-role-types';

@Injectable()
export class AreaRoleService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll(): Promise<AreaRoleResponse[]>{
        const areaRoles = await this.prisma.areaRole.findMany({
            include: {
                area: true,
                role: true
            }
        });

        return areaRoles.map(ar => ({
            id: ar.id,
            roleId: ar.roleId,
            areaId: ar.areaId,
            roleName: ar.role.name,
            areaName: ar.area.name
        }))
    }
}
