import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-rol.dto';
import { AssignableUser, AssignableUsersByArea, RoleResponse, RoleResponseWithRelations } from './types/roles-types';
import { UserLdapSyncService } from '../users/user-ldap-sync.service';
import { permission } from 'process';


@Injectable()
export class RolesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userLdapSyncService: UserLdapSyncService

    ) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------
    async findAll(): Promise<RoleResponse[]> {
        const roles = await this.prisma.role.findMany({
            include: this.getRoleRelationsInclude()
        })

        return roles.map(role => this.formatRoleWithRelations(role))

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
    async getAssignableUsersForRole(roleId: string): Promise<AssignableUser[] | AssignableUsersByArea[]> {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        if (role.scope === 'GLOBAL') {
            return await this.getAssignableGlobalUsers(roleId);
        } else if (role.scope === 'LOCAL') {
            return await this.getAssignableLocalUsers(roleId);
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
        if (!role.scope || !['GLOBAL', 'LOCAL'].includes(role.scope))
            throw new BadRequestException('Role scope must be GLOBAL or LOCAL');

        // Para roles locales, debe venir areaIds
        if (role.scope === 'LOCAL' && (!role.areaIds || !Array.isArray(role.areaIds) || role.areaIds.length === 0)) {
            throw new BadRequestException('areaIds are required for LOCAL roles');
        }

        // Usamos transacción para crear el rol y sus relaciones con áreas
        const createdRole = await this.prisma.$transaction(async (tx) => {
            const newRole = await tx.role.create({
                data: {
                    name: role.name,
                    description: role.description,
                    scope: role.scope
                }
            });


            if (role.scope === 'LOCAL') {
                await Promise.all(
                    role.areaIds!.map(areaId =>
                        tx.areaRole.create({ data: { roleId: newRole.id, areaId } })
                    )
                );
            }

            return newRole;
        });

        const fullRole = await this.prisma.role.findUnique({
            where: { id: createdRole.id },
            include: this.getRoleRelationsInclude()
        });

        return this.formatRoleWithRelations(fullRole);

    }

    //Function to add permission to a role
    async addPermissionToRole(roleId: string, permissionIds: string[]): Promise<{ message: string }> {
        
        if (!roleId || !permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
            throw new BadRequestException('Es necesario proporcionar el rol y el/los permisos a asignar');
        }
        if (!(await this.roleExist(roleId))) throw new NotFoundException('Role not found');

        for (const permissionId of permissionIds) {
            await this.ensureRoleAndPermissionExist(roleId, permissionId);
        }

        // Elimina duplicados existentes para evitar errores de clave única
        const existing = await this.prisma.rolePermission.findMany({
            where: {
                roleId,
                permissionId: { in: permissionIds }
            }
        });
        const existingIds = new Set(existing.map(e => e.permissionId));
        const toInsert = permissionIds.filter(id => !existingIds.has(id));

        if (toInsert.length === 0) {
            throw new BadRequestException('All permissions already exist for this role');
        }

        await this.prisma.rolePermission.createMany({
            data: toInsert.map(permissionId => ({roleId, permissionId})),
            skipDuplicates: true
        })
        return { message: 'Permission added to role successfully' };
    }

    //Assign user to a role
    async assignUsersToRole(
        roleId: string,
        userIds: string[],
        areaId?: string
    ): Promise<{ message: string }> {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        let areaName: string | undefined

        await this.prisma.$transaction(async (tx) => {
            if (role.scope === 'GLOBAL') {
                await this.assignUsersToGlobalRole(tx, roleId, userIds);
            } else if (role.scope === 'LOCAL') {
                if (!areaId) throw new BadRequestException('Debes seleccionar el área para asignar usuarios para este rol');
                const area = await tx.area.findUnique({ where: { id: areaId } });
                if (!area) throw new NotFoundException('Area not found');
                areaName = area.name;
                await this.assignUsersToLocalRole(tx, roleId, userIds, areaId);
            } else {
                throw new BadRequestException('Unknown role scope');
            }

            await this.syncRoleAssignmentWithLdap(role, userIds, areaName)
        });

        return { message: 'Users assigned to role successfully' };
    }


    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing role information or settings)
    //--------------------------------------------------------------------------------------
    async update(id: string, updateRoleDto: Partial<CreateRoleDto>): Promise<RoleResponse> {
        if (!(await this.roleExist(id))) throw new NotFoundException('Role not found');
        if (updateRoleDto.name && updateRoleDto.name.length < 2) throw new BadRequestException('Role name must be at least 2 characters long');
        if (updateRoleDto.scope && !['GLOBAL', 'LOCAL'].includes(updateRoleDto.scope))
            throw new BadRequestException('Role scope must be GLOBAL or LOCAL');


        if (updateRoleDto.scope === 'LOCAL' && updateRoleDto.areaIds && (!Array.isArray(updateRoleDto.areaIds) || updateRoleDto.areaIds.length === 0)) {
            throw new BadRequestException('areaIds are required for LOCAL roles');
        }

        const { areaIds, ...roleData } = updateRoleDto;


        const updatedRole = await this.prisma.$transaction(async (tx) => {
            const role = await tx.role.update({
                where: { id },
                data: roleData,
            });


            if (role.scope === 'LOCAL' && areaIds) {
                await tx.areaRole.deleteMany({ where: { roleId: id } });
                await Promise.all(
                    areaIds.map(areaId =>
                        tx.areaRole.create({ data: { roleId: id, areaId } })
                    )
                );
            }

            return role;
        });

        const fullRole = await this.prisma.role.findUnique({
            where: { id: updatedRole.id },
            include: this.getRoleRelationsInclude()
        });

        return this.formatRoleWithRelations(fullRole);
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

    async updateRoleUsers(
        roleId: string,
        userIds: string[],
        areaId?: string
    ): Promise<{ message: string }> {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        await this.prisma.$transaction(async (tx) => {
            if (role.scope === 'GLOBAL') {
                await tx.userRole.deleteMany({ where: { roleId } });
                await this.assignUsersToGlobalRole(tx, roleId, userIds);
            } else if (role.scope === 'LOCAL') {
                if (!areaId) throw new BadRequestException('areaId is required for local roles');
                await tx.userRoleLocal.deleteMany({ where: { roleId, areaId } });
                await this.assignUsersToLocalRole(tx, roleId, userIds, areaId);
            } else {
                throw new BadRequestException('Unknown role scope');
            }
        });

        return { message: 'Role users updated successfully' };
    }





    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to remove existing role information or settings)
    //--------------------------------------------------------------------------------------

    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Role ID is required');
        const role = await this.prisma.role.findUnique({ where: { id } });
        if (!role) throw new NotFoundException('Role not found');
        if (!(await this.roleExist(id))) throw new NotFoundException('Role not found');

        let areaName: string | undefined
        if (role.scope === 'LOCAL') {
            const areaRole = await this.prisma.areaRole.findFirst({ where: { roleId: id }, include: { area: true } });
            areaName = areaRole?.area.name;
        }

        await this.prisma.$transaction(async (tx) => {
            // Elimina relaciones internas (por si acaso, aunque tengas onDelete: Cascade)
            await tx.userRole.deleteMany({ where: { roleId: id } });
            await tx.userRoleLocal.deleteMany({ where: { roleId: id } });
            await tx.areaRole.deleteMany({ where: { roleId: id } });
            await tx.rolePermission.deleteMany({ where: { roleId: id } });

            try {
                const roleType = role.scope === 'GLOBAL' ? 'role_global' : 'role_local';
                const ldapResponse = await this.userLdapSyncService.deleteRoleGroupInLdap(roleType, role.name, areaName);
                if (!ldapResponse.success) {
                    throw new BadRequestException(`LDAP: ${ldapResponse.data || ldapResponse.message || 'Unknown error'}`);
                }
            } catch (error) {
                const detail = error?.response?.data?.detail || error?.response?.data?.message || error.message;
                throw new BadRequestException(detail);
            }

            await tx.role.delete({ where: { id } });
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

    async removeUserFromRole(
        roleId: string,
        userId: string,
        areaId?: string
    ): Promise<{ message: string }> {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');

        let areaName: string | undefined
        let userEmail: string

        await this.prisma.$transaction(async (tx) => {

            if (role.scope === 'GLOBAL') {
                await tx.userRole.delete({
                    where: { userId_roleId: { userId, roleId } }
                });
            } else if (role.scope === 'LOCAL') {
                if (!areaId) throw new BadRequestException('Error al enviar el area al servidor');

                const area = await tx.area.findUnique({ where: { id: areaId } });
                if (!area) throw new NotFoundException('Area not found');
                areaName = area.name;

                await tx.userRoleLocal.deleteMany({
                    where: { userId, roleId, areaId }
                });

            } else {
                throw new BadRequestException('Unknown role scope');
            }

            const user = await tx.user.findUnique({
                where: { id: userId },
                select: { email: true }
            });
            if (!user) throw new NotFoundException('User not found');
            userEmail = user.email;


            const roleType = role.scope === 'GLOBAL' ? 'role_global' : 'role_local';

            try {
                await this.userLdapSyncService.removeRoleFromUserInLdap(userEmail, roleType, role.name, areaName);
            } catch (error) {
                const detail = error?.response?.data?.detail || error?.response?.data?.message || error.message;
                throw new BadRequestException(detail);

            }

        })

        return { message: 'User removed from role successfully' };


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


    private async assignUsersToLocalRole(prismaClient: any, roleId: string, userIds: string[], areaId: string) {
        for (const userId of userIds) {
            const exists = await prismaClient.userRoleLocal.findFirst({
                where: { userId, areaId, roleId }
            });
            if (!exists) {
                await prismaClient.userRoleLocal.create({ data: { userId, areaId, roleId } });
            }
        }
    }

    private async getAssignableGlobalUsers(roleId: string): Promise<AssignableUser[]> {
        const userRoles = await this.prisma.userRole.findMany({ where: { roleId } });
        const assignedUserIds = new Set(userRoles.map(ur => ur.userId));
        const users = await this.prisma.user.findMany({
            where: { id: { notIn: Array.from(assignedUserIds) } },
            include: {
                areas: {
                    include: {
                        area: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });
        return users.map(u => ({
            userId: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            areas: u.areas.map(ua => ({
                areaId: ua.area.id,
                areaName: ua.area.name
            }))
        }));
    }

    private async getAssignableLocalUsers(roleId: string): Promise<AssignableUsersByArea[]> {
        const areaRoles = await this.prisma.areaRole.findMany({ where: { roleId }, include: { area: true } });
        const result: AssignableUsersByArea[] = [];
        for (const ar of areaRoles) {
            const userAreas = await this.prisma.userArea.findMany({ where: { areaId: ar.areaId }, include: { user: true } });
            const userRoleLocals = await this.prisma.userRoleLocal.findMany({ where: { areaId: ar.areaId, roleId } });
            const assignedUserIds = new Set(userRoleLocals.map(ul => ul.userId));
            const assignableUsers: AssignableUser[] = userAreas
                .filter(ua => !assignedUserIds.has(ua.userId))
                .map(ua => ({
                    userId: ua.user.id,
                    firstName: ua.user.firstName,
                    lastName: ua.user.lastName,
                    areas: [{
                        areaId: ar.areaId,
                        areaName: ar.area.name
                    }]
                }));
            if (assignableUsers.length > 0) {
                result.push({
                    areaId: ar.areaId,
                    areaName: ar.area.name,
                    users: assignableUsers
                });
            }
        }
        return result;
    }


    private getRoleRelationsInclude() {
        return {
            areaRoles: {
                include: {
                    area: {
                        select: { id: true, name: true }
                    }
                }
            },
            users: {
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true }
                    }
                }
            },
            userRoleLocals: {
                include: {
                    user: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    area: {
                        select: { id: true, name: true }
                    }
                }
            },
            permissions: {
                include: {
                    permission: {
                        select: { id: true, name: true }
                    }
                }
            }
        };
    }

    private formatRoleWithRelations(role: any): RoleResponseWithRelations {
        return {
            id: role.id,
            name: role.name,
            description: role.description,
            scope: role.scope,
            createdAt: role.createdAt?.toISOString(),
            updatedAt: role.updatedAt?.toISOString(),
            areaIds: role.areaRoles?.map(ar => ar.area.id) ?? [],
            users: [
                ...(role.users?.map(ur => ({
                    userId: ur.user.id,
                    firstName: ur.user.firstName,
                    lastName: ur.user.lastName,
                    areas: []
                })) ?? []),
                ...(role.userRoleLocals?.map(ul => ({
                    userId: ul.user.id,
                    firstName: ul.user.firstName,
                    lastName: ul.user.lastName,
                    areas: [{
                        areaId: ul.area.id,
                        areaName: ul.area.name
                    }]
                })) ?? [])
            ],
            permissions: role.permissions?.map(rp => ({
                id: rp.permission.id,
                name: rp.permission.name
            })) ?? []
        };
    }


    private async syncRoleAssignmentWithLdap(role: any, userIds: string[], areaName?: string): Promise<void> {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { email: true }
        })

        const userEmails = users.map(user => user.email);

        const ldapPayload = role.scope === 'GLOBAL'
            ? {
                users: userEmails,
                role_global: role.name
            }
            : {
                users: userEmails,
                role_local: role.name,
                area: areaName
            }

        const ldapResponse = await this.userLdapSyncService.assignRolesToUsersInLdap(ldapPayload);

        if (!ldapResponse.success) {
            throw new BadRequestException(`Error syncing role assignment with LDAP: ${ldapResponse.message}`);
        }
    }



}
