import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-rol.dto';
import { RoleResponse } from './types/roles-types';


@Injectable()
export class RolesService {
    constructor(private readonly prisma: PrismaService) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------
    async findAll(): Promise<RoleResponse[]> {
        return this.prisma.role.findMany();
    }

    async findOne(id: string): Promise<RoleResponse> {
        if (!id) throw new BadRequestException('Role ID is required');
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    //Function to check if a role exists by name or id
    async getPermissionsForRole(roleId: string) {
        if (!await this.roleExist(roleId)) throw new NotFoundException('Role not found');
        return this.prisma.rolePermission.findMany({
            where: { roleId },
            include: { permission: true }
        });
    }

    //Function to get users assignable to a specific role
    async getAssignableUsersForRole(roleId: string): Promise<any[]> {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        if (role.scope === 'GLOBAL') {
            // Usuarios que NO tienen el rol global
            const userRoles = await this.prisma.userRole.findMany({ where: { roleId } });
            const assignedUserIds = new Set(userRoles.map(ur => ur.userId));
            const users = await this.prisma.user.findMany({
                where: { id: { notIn: Array.from(assignedUserIds) } }
            });
            return users;
        } else if (role.scope === 'LOCAL') {
            // Usuarios que pertenecen a torres donde el rol está disponible y NO tienen el rol local en esa torre
            const towerRoles = await this.prisma.towerRole.findMany({ where: { roleId }, include: { tower: true } });
            const result = [];
            for (const tr of towerRoles) {
                // Usuarios en la torre
                const userTowers = await this.prisma.userTower.findMany({ where: { towerId: tr.towerId }, include: { user: true } });
                // Usuarios que ya tienen el rol local en esa torre
                const userRoleLocals = await this.prisma.userRoleLocal.findMany({ where: { towerId: tr.towerId, roleId } });
                const assignedUserIds = new Set(userRoleLocals.map(ul => ul.userId));
                // Filtra usuarios que aún no tienen el rol local en esa torre
                const assignableUsers = userTowers
                    .filter(ut => !assignedUserIds.has(ut.userId))
                    .map(ut => ({
                        userId: ut.user.id,
                        firstName: ut.user.firstName,
                        lastName: ut.user.lastName,
                        towerId: tr.towerId,
                        towerName: tr.tower.name
                    }));
                if (assignableUsers.length > 0) {
                    result.push({
                        towerId: tr.towerId,
                        towerName: tr.tower.name,
                        users: assignableUsers
                    });
                }
            }
            return result;
        } else {
            throw new BadRequestException('Unknown role scope');
        }
    }


    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new role or related resources)
    //--------------------------------------------------------------------------------------

    async create(role: CreateRoleDto): Promise<RoleResponse> {
        if (!role.name || role.name.length < 2) throw new BadRequestException('Role name is required and must be at least 2 characters long');
        if (await this.roleExist(role.name)) throw new BadRequestException('Role with this name already exists');

        const newRole = await this.prisma.role.create({
            data: { ...role },
        });
        return newRole;
    }

    //Function to add permission to a role
    async addPermissionToRole(roleId: string, permissionId: string): Promise<{ message: string }> {
        if (!roleId || !permissionId) throw new BadRequestException('Role ID and Permission ID are required');
        await this.ensureRoleAndPermissionExist(roleId, permissionId);
        const exists = await this.prisma.rolePermission.findUnique({
            where: { roleId_permissionId: { roleId, permissionId } },
        })

        if (exists) throw new BadRequestException('Permission already exists for this role');

        await this.prisma.rolePermission.create({
            data: { roleId, permissionId },
        })
        return { message: 'Permission added to role successfully' };
    }

    //Assign user to a role
    async assignUsersToRole(
        roleId: string,
        userIds: string[],
        towerId?: string // solo para roles locales
    ): Promise<{ message: string }> {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        await this.prisma.$transaction(async (tx) => {
            if (role.scope === 'GLOBAL') {
                await this.assignUsersToGlobalRole(tx, roleId, userIds);
            } else if (role.scope === 'LOCAL') {
                if (!towerId) throw new BadRequestException('towerId is required for local roles');
                await this.assignUsersToLocalRole(tx, roleId, userIds, towerId);
            } else {
                throw new BadRequestException('Unknown role scope');
            }
        });

        return { message: 'Users assigned to role successfully' };
    }


    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing role information or settings)
    //--------------------------------------------------------------------------------------
    async update(id: string, user: Partial<CreateRoleDto>): Promise<RoleResponse> {
        if (!(await this.roleExist(id))) throw new NotFoundException('Role not found');
        if (user.name && user.name.length < 2) throw new BadRequestException('Role name must be at least 2 characters long');

        const updatedRole = await this.prisma.role.update({
            where: { id },
            data: user,
        });
        return updatedRole;
    }

    //Function to update permissions for a role
    async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<{ message: string }> {
        if (!await this.roleExist(roleId)) throw new NotFoundException('Role not found');

        await this.prisma.$transaction(async (tx) => {
            await tx.rolePermission.deleteMany({ where: { roleId } });

            const data = permissionIds.map(permissionId => ({ roleId, permissionId }));
            if (data.length) {
                await tx.rolePermission.createMany({ data });
            }
        });

        return { message: 'Role permissions updated successfully' };
    }





    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to remove existing role information or settings)
    //--------------------------------------------------------------------------------------

    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Role ID is required');
        if (!(await this.roleExist(id))) throw new NotFoundException('Role not found');
        await this.prisma.role.delete({
            where: { id },
        });
        return { message: 'Role deleted successfully' };
    }

    //Function to remove permission from a role
    async removePermissionFromRole(roleId: string, permissionId: string): Promise<{ message: string }> {
        if (!roleId || !permissionId) throw new BadRequestException('Role ID and Permission ID are required');
        await this.ensureRoleAndPermissionExist(roleId, permissionId);

        const exists = await this.prisma.rolePermission.findUnique({
            where: { roleId_permissionId: { roleId, permissionId } },
        });

        if (!exists) throw new BadRequestException('Permission does not exist for this role');

        await this.prisma.rolePermission.delete({
            where: { roleId_permissionId: { roleId, permissionId } },
        });
        return { message: 'Permission removed from role successfully' };
    }

    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS (Used internally to validate data, handle relations, or perform other utility tasks)
    //--------------------------------------------------------------------------------------

    private async roleExist(name: string): Promise<boolean> {
        let role: RoleResponse | null;
        if (name.length === 36) {
            role = await this.prisma.role.findUnique({ where: { id: name } });
        } else {
            role = await this.prisma.role.findUnique({ where: { name } });
        }
        return !!role;
    }

    private async ensureRoleAndPermissionExist(roleId: string, permissionId: string) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) throw new NotFoundException('Role not found');
        const permission = await this.prisma.permission.findUnique({
            where: { id: permissionId },
        });
        if (!permission) throw new NotFoundException('Permission not found');
    }


    private async assignUsersToGlobalRole(prismaClient: any, roleId: string, userIds: string[]) {
        for (const userId of userIds) {
            const exists = await prismaClient.userRole.findUnique({
                where: { userId_roleId: { userId, roleId } }
            });
            if (!exists) {
                await prismaClient.userRole.create({ data: { userId, roleId } });
            }
        }
    }


    private async assignUsersToLocalRole(prismaClient: any, roleId: string, userIds: string[], towerId: string) {
        for (const userId of userIds) {
            const exists = await prismaClient.userRoleLocal.findFirst({
                where: { userId, towerId, roleId }
            });
            if (!exists) {
                await prismaClient.userRoleLocal.create({ data: { userId, towerId, roleId } });
            }
        }
    }



}
