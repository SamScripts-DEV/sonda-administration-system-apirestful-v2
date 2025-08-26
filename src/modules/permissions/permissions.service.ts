import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionResponse } from './types/permissions-types';

@Injectable()
export class PermissionsService {
    constructor(private readonly prisma: PrismaService) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------

    async findAll(): Promise<PermissionResponse[]> {
        return this.prisma.permission.findMany();
    }

    async findOne(id: string): Promise<PermissionResponse> {
        if (!id) throw new BadRequestException('Permission ID is required');
        const permission = await this.prisma.permission.findUnique({ where: { id } });
        if (!permission) throw new NotFoundException('Permission not found');
        return permission;
    }

    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new permission or related resources)
    //--------------------------------------------------------------------------------------

    async create(dto: CreatePermissionDto): Promise<PermissionResponse> {
        if (!dto.code || dto.code.length < 2) throw new BadRequestException('Permission code is required and must be at least 2 characters long');
        if (await this.permissionExist(dto.code)) throw new BadRequestException('Permission with this code already exists');
        return this.prisma.permission.create({
            data: { ...dto }
        });
    }

    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing permission information or settings)
    //--------------------------------------------------------------------------------------

    async update(id: string, dto: Partial<CreatePermissionDto>): Promise<PermissionResponse> {
        if (!(await this.permissionExist(id, true))) throw new NotFoundException('Permission not found');
        if (dto.code && dto.code.length < 2) throw new BadRequestException('Permission code must be at least 2 characters long');
        return this.prisma.permission.update({ where: { id }, data: dto });
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to remove existing permission information or settings)
    //--------------------------------------------------------------------------------------

    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Permission ID is required');
        if (!(await this.permissionExist(id, true))) throw new NotFoundException('Permission not found');
        await this.prisma.permission.delete({ where: { id } });
        return { message: 'Permission deleted successfully' };
    }
    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS (Used internally to validate data, handle relations, or perform other utility tasks)
    //--------------------------------------------------------------------------------------

    private async permissionExist(value: string, byId = false): Promise<boolean> {
        let permission: PermissionResponse | null;
        if (byId || value.length === 36) {
            permission = await this.prisma.permission.findUnique({ where: { id: value } });
        } else {
            permission = await this.prisma.permission.findUnique({ where: { code: value } });
        }
        return !!permission;
    }
}
