import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrganizationalGroupDto, GroupType } from './dto/create-organizational-groups.dto';
import {
    OrganizationalGroupResponse,
    GroupMemberResponse,
    OrganizationalGroupHierarchy,
    OrgChartNode,
    AssignableUserResponse,
    HierarchyChainItem,
    LdapOrgGroupAssignmentPayload,
    LdapOrgGroupRemovalPayload,
    LdapOrgGroupUpdatePayload
} from './types/organizational-groups-types';
import { OrgGroupLdapSyncService } from './organizational-groups-ldap-sync.service';

@Injectable()
export class OrganizationalGroupsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly orgGroupLdapSyncService: OrgGroupLdapSyncService
    ) { }

    private readonly USER_SELECT = {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
        position: { select: { name: true } }
    };




    //Methods for Organizational Groups
    async create(dto: CreateOrganizationalGroupDto): Promise<OrganizationalGroupResponse> {
        await this.validateCreateInput(dto);

        const group = await this.prisma.organizationalGroup.create({
            data: dto,
            include: this.getGroupIncludes()
        });

        return this.formatGroupResponse(group)

    }

    async findAll(): Promise<OrganizationalGroupResponse[]> {
        const groups = await this.prisma.organizationalGroup.findMany({
            include: {
                area: true,
                parent: true,
                _count: { select: { members: true } },
                children: {
                    include: {
                        area: true,
                        _count: { select: { members: true } }
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                imageUrl: true,
                                position: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: [
                { hierarchyLevel: 'asc' },
                { name: 'asc' }
            ]
        });

        return groups.map(group => this.formatGroupResponseWithMembers(group));
    }

    async findOne(id: string): Promise<OrganizationalGroupResponse> {
        const group = await this.findGroupById(id, true);
        return this.formatGroupResponseWithMembers(group);
    }

    async update(id: string, dto: Partial<CreateOrganizationalGroupDto>): Promise<OrganizationalGroupResponse> {
        const currentGroup = await this.findGroupById(id);

        await this.validateUpdateInput(id, dto);


        const nameChanged = dto.name && dto.name !== currentGroup.name;
        const levelChanged = dto.hierarchyLevel !== undefined && dto.hierarchyLevel !== currentGroup.hierarchyLevel;
        const parentChanged = dto.parentId !== undefined && dto.parentId !== currentGroup.parentId;
        const areaChanged = dto.areaId !== undefined && dto.areaId !== currentGroup.areaId;

        const affectsHierarchy = nameChanged || levelChanged || parentChanged || areaChanged;


        if (dto.parentId) {
            const parent = await this.prisma.organizationalGroup.findUnique({
                where: { id: dto.parentId },
                select: { areaId: true }
            });

            if (parent?.areaId && dto.areaId === undefined) {
                dto.areaId = parent.areaId;
            }
        }

        const updatedGroup = await this.prisma.organizationalGroup.update({
            where: { id },
            data: dto,
            include: this.getGroupIncludes()
        });

        if (affectsHierarchy) {
            const membersCount = await this.prisma.userOrganizationalGroup.count({
                where: { groupId: id }
            });

            if (membersCount > 0) {
                try {

                    const newHierarchyChain = await this.buildHierarchyChain(id);


                    const ldapPayload: LdapOrgGroupUpdatePayload = {
                        old_group_name: currentGroup.name,
                        old_hierarchy_level: currentGroup.hierarchyLevel,
                        new_group_name: updatedGroup.name,
                        new_hierarchy_level: updatedGroup.hierarchyLevel,
                        new_hierarchy_chain: newHierarchyChain
                    };


                    await this.orgGroupLdapSyncService.updateOrgGroupInLdap(ldapPayload);

                    console.log(`Synchronized ${membersCount} users with updated hierarchy in LDAP`);
                } catch (error) {
                    console.error('Error syncing hierarchy changes with LDAP:', error.message);

                }
            } else {
                console.log('Group updated but has no members, LDAP sync skipped');
            }
        }

        return this.formatGroupResponse(updatedGroup);
    }

    async remove(id: string): Promise<{ message: string }> {
        let deletedMembersCount = 0;
        let groupName = '';

        await this.prisma.$transaction(async (tx) => {
            const group = await tx.organizationalGroup.findUnique({
                where: { id },
                include: {
                    children: true,
                    members: true,
                    parent: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            if (!group) {
                throw new NotFoundException('Organizational group not found');
            }

            groupName = group.name;

            if (group.children && group.children.length > 0) {
                const childrenNames = group.children.map(c => c.name).join(', ');
                throw new BadRequestException(
                    `Cannot delete group "${group.name}" because it has ${group.children.length} child group(s): ${childrenNames}. ` +
                    `Please delete or reassign child groups first.`
                );
            }
            if (group.members && group.members.length > 0) {
                deletedMembersCount = group.members.length;

                await tx.userOrganizationalGroup.deleteMany({
                    where: { groupId: id }
                });
            }
            await tx.organizationalGroup.delete({
                where: { id }
            });
        });

        return {
            message: `Organizational group "${groupName}" deleted successfully. ` +
                `${deletedMembersCount} member(s) removed from the group.`
        };
    }




    //Methods for Group Members


    async getAssignableUsers(groupId: string): Promise<AssignableUserResponse[]> {
        const group = await this.prisma.organizationalGroup.findUnique({
            where: { id: groupId },
            select: {
                id: true,
                areaId: true
            }
        });

        if (!group) {
            throw new NotFoundException('Group organizational not found');
        }

        const existingMembers = await this.prisma.userOrganizationalGroup.findMany({
            where: { groupId },
            select: { userId: true }
        });

        const existingUserIds = existingMembers.map(m => m.userId);


        const where: any = {
            active: true,
            id: {
                notIn: existingUserIds
            }
        };

        if (group.areaId) {
            where.areas = {
                some: {
                    areaId: group.areaId
                }
            };
        }

        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                imageUrl: true,
                position: {
                    select: {
                        name: true
                    }
                },
                department: {
                    select: {
                        name: true
                    }
                },
                areas: {
                    include: {
                        area: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: [
                { firstName: 'asc' },
                { lastName: 'asc' }
            ]
        });


        return users.map(user => ({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            position: user.position?.name,
            department: user.department?.name,
            area: user.areas.map(ua => ua.area.name).join(', '),
            imageUrl: user.imageUrl || undefined
        }));
    }

    async addMembers(groupId: string, userIds: string[]): Promise<GroupMemberResponse[]> {
        await this.findGroupById(groupId);
        await this.validateUsersExist(userIds);

        return this.prisma.$transaction(async (tx) => {
            const members = await Promise.all(
                userIds.map(userId => this.addMemberToGroup(groupId, userId, tx))
            );

            const users = await tx.user.findMany({
                where: { id: { in: userIds } },
                select: { email: true }
            })

            const userEmails = users.map(u => u.email);

            try {
                const ldapPayload = await this.prepareLdapAssignmentPayload(groupId, userEmails);
                await this.orgGroupLdapSyncService.assignMembersToOrgGroupInLdap(ldapPayload)
            } catch (error) {
                console.error('Error syncing with LDAP: ', error.message);
                throw new BadRequestException(`Error syncing members with LDAP: ${error.message}`)
            }

            return members.map(m => this.formatMemberResponse(m))
        });

    }

    async removeMember(groupId: string, memberId: string): Promise<{ message: string }> {
        const member = await this.prisma.userOrganizationalGroup.findUnique({
            where: { id: memberId },
            include: {
                user: { select: { email: true } },
                group: {
                    select: {
                        name: true,
                        hierarchyLevel: true
                    }
                }
            }
        });

        if (!member) {
            throw new NotFoundException('Member relationship not found');
        }

        if (member.groupId !== groupId) {
            throw new BadRequestException('Member does not belong to the specified group');
        }

        await this.prisma.$transaction(async (tx) => {

            await tx.userOrganizationalGroup.delete({
                where: { id: memberId }
            });

            try {
                await this.orgGroupLdapSyncService.removeUserFromOrgGroupInLdap(
                    member.user.email,
                    member.group.name,
                    member.group.hierarchyLevel
                );

                console.log(`User ${member.user.email} removed from group "${member.group.name}" in LDAP`);
            } catch (error) {
                console.error('⚠️ Error syncing removal with LDAP:', error.message);
                throw new BadRequestException(`Error syncing member removal with LDAP: ${error.message}`);
            }
        });

        return { message: 'Member removed successfully' };
    }




    async findByArea(areaId: string): Promise<OrganizationalGroupResponse[]> {
        const groups = await this.prisma.organizationalGroup.findMany({
            where: { areaId },
            include: this.getGroupIncludes(),
            orderBy: [
                { hierarchyLevel: 'asc' },
                { name: 'asc' }
            ]
        })

        return groups.map(group => this.formatGroupResponse(group))
    }

    async getHierarchy(groupId: string): Promise<OrganizationalGroupHierarchy> {
        const group = await this.prisma.organizationalGroup.findUnique({
            where: { id: groupId },
            include: this.getHierarchyIncludes()
        });

        if (!group) throw new NotFoundException('Group organizational not found');

        return this.buildHierarchy(group);
    }


    async getOrgChartFlat(areaId?: string): Promise<OrgChartNode[]> {
        const where = areaId ? { areaId } : {};

        const groups = await this.prisma.organizationalGroup.findMany({
            where,
            include: {
                area: {
                    select: { name: true }
                },
                members: {
                    include: {
                        user: {
                            select: this.USER_SELECT
                        }
                    }
                },
                _count: {
                    select: { members: true }
                }
            },
            orderBy: {
                hierarchyLevel: 'asc'
            }
        });

        const nodes: OrgChartNode[] = [];

        // Agregar todos los GRUPOS como nodos
        groups.forEach(group => {
            nodes.push({
                key: group.id,
                name: group.name,
                type: 'GROUP',
                hierarchyLevel: group.hierarchyLevel,
                parent: group.parentId || undefined,              // JERARQUÍA: reporta a
                container: group.containerGroupId || undefined,   // NUEVO: está dentro de
                isGroup: true,
                groupType: group.groupType as GroupType,
                areaName: group.area?.name,
                membersCount: group._count.members
            });

            // Agregar cada MIEMBRO como nodo individual
            group.members.forEach(member => {
                nodes.push({
                    key: member.user.id,
                    name: `${member.user.firstName} ${member.user.lastName}`,
                    type: 'PERSON',
                    hierarchyLevel: group.hierarchyLevel + 0.5,
                    parent: group.id,
                    container: group.containerGroupId || group.id,
                    group: group.id,
                    isGroup: false,
                    position: member.user.position?.name,
                    imageUrl: member.user.imageUrl || undefined,
                    email: member.user.email
                });
            });
        });

        return nodes;
    }





    // Helper Methods

    private formatGroupResponse(group: any): OrganizationalGroupResponse {
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            groupType: group.groupType,
            areaId: group.areaId,
            areaName: group.area?.name,
            parentId: group.parentId,
            parentName: group.parent?.name,
            containerGroupId: group.containerGroupId,
            containerGroupName: group.containerGroup?.name,
            hierarchyLevel: group.hierarchyLevel,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            membersCount: group._count?.members || 0
        };
    }

    private formatGroupResponseWithMembers(group: any): OrganizationalGroupResponse {
        return {
            ...this.formatGroupResponse(group),
            children: group.children?.map((child: any) => this.formatGroupResponse(child)),
            members: group.members?.map((m: any) => this.formatMemberResponse(m))
        };
    }

    private formatMemberResponse(member: any): GroupMemberResponse {
        return {
            id: member.id,
            userId: member.user.id,
            userName: `${member.user.firstName} ${member.user.lastName}`,
            userEmail: member.user.email,
            userPosition: member.user.position?.name,
            userImageUrl: member.user.imageUrl,
            createdAt: member.createdAt
        };
    }


    private buildHierarchy(group: any): OrganizationalGroupHierarchy {
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            hierarchyLevel: group.hierarchyLevel,
            areaName: group.area?.name,
            members: group.members?.map((m: any) => this.formatMemberResponse(m)) || [],
            children: group.children?.map((child: any) => this.buildHierarchy(child)) || []
        };
    }

    private async validateCreateInput(dto: CreateOrganizationalGroupDto): Promise<void> {
        // Validar área si se proporciona
        if (dto.areaId) {
            await this.validateAreaExists(dto.areaId);
        }

        // NUEVO: Validar contenedor si se proporciona
        if (dto.containerGroupId) {
            const container = await this.prisma.organizationalGroup.findUnique({
                where: { id: dto.containerGroupId },
                select: {
                    id: true,
                    groupType: true,
                    hierarchyLevel: true,
                    areaId: true
                }
            });

            if (!container) {
                throw new NotFoundException('The specified container group does not exist');
            }

            // Solo CONTAINER puede contener otros grupos
            if (container.groupType !== 'CONTAINER') {
                throw new BadRequestException(
                    `Only CONTAINER groups can contain other groups. ` +
                    `The specified container has type: ${container.groupType}`
                );
            }

            // El contenido debe estar en el mismo nivel o superior al contenedor
            if (dto.hierarchyLevel < container.hierarchyLevel) {
                throw new BadRequestException(
                    `Contained groups cannot be at a lower hierarchy level than their container. ` +
                    `Container is at level ${container.hierarchyLevel}, you provided level ${dto.hierarchyLevel}.`
                );
            }

            // Herencia automática de área del contenedor
            if (container.areaId && !dto.areaId) {
                dto.areaId = container.areaId;
            }
        }

        // Validar padre y jerarquía (MODIFICADO - más flexible)
        if (dto.parentId) {
            const parent = await this.prisma.organizationalGroup.findUnique({
                where: { id: dto.parentId },
                select: {
                    id: true,
                    hierarchyLevel: true,
                    areaId: true
                }
            });

            if (!parent) {
                throw new NotFoundException('The specified parent group does not exist');
            }

            // VALIDACIÓN FLEXIBLE: Permite mismo nivel o superior
            if (dto.hierarchyLevel < parent.hierarchyLevel) {
                throw new BadRequestException(
                    `Child cannot be at a lower hierarchy level than parent. ` +
                    `Parent is at level ${parent.hierarchyLevel}, you provided level ${dto.hierarchyLevel}.`
                );
            }

            // Límite razonable: máximo 3 niveles de diferencia
            if (dto.hierarchyLevel > parent.hierarchyLevel + 3) {
                throw new BadRequestException(
                    `Child level too high. Maximum allowed: ${parent.hierarchyLevel + 3}.`
                );
            }

            // VALIDACIÓN 2: Herencia de área (si no tiene contenedor que defina el área)
            if (parent.areaId && !dto.containerGroupId) {
                if (dto.areaId && dto.areaId !== parent.areaId) {
                    throw new BadRequestException(
                        `Child group must inherit parent's area. ` +
                        `Parent area ID: ${parent.areaId}, you provided: ${dto.areaId}.`
                    );
                }

                if (!dto.areaId) {
                    dto.areaId = parent.areaId;
                }
            }
        } else {
            // Sin padre = debe ser nivel 0 (raíz)
            if (dto.hierarchyLevel !== 0) {
                throw new BadRequestException(
                    `Groups without parent must be level 0 (root level). ` +
                    `You provided level ${dto.hierarchyLevel}.`
                );
            }
        }

        // VALIDACIÓN: Nombres duplicados en mismo nivel/área/contenedor
        const duplicate = await this.prisma.organizationalGroup.findFirst({
            where: {
                name: dto.name,
                hierarchyLevel: dto.hierarchyLevel,
                areaId: dto.areaId || null,
                containerGroupId: dto.containerGroupId || null
            }
        });

        if (duplicate) {
            throw new BadRequestException(
                `A group named "${dto.name}" already exists at level ${dto.hierarchyLevel} ` +
                `${dto.containerGroupId ? 'in this container' : dto.areaId ? 'in this area' : 'at root level'}.`
            );
        }
    }

    private async validateUpdateInput(id: string, dto: Partial<CreateOrganizationalGroupDto>): Promise<void> {
        if (dto.parentId === id) {
            throw new BadRequestException('A group cannot be its own parent');
        }

        // PASO 1: Obtener grupo actual AL INICIO
        const currentGroup = await this.prisma.organizationalGroup.findUnique({
            where: { id },
            include: {
                children: true,
                parent: {
                    select: { areaId: true, hierarchyLevel: true}
                },
                containerGroup: {
                    select: { areaId: true, hierarchyLevel: true, groupType: true }
                }
            }
        });

        if (!currentGroup) {
            throw new NotFoundException('Group organizational not found');
        }

        // PASO 2: Validar contenedor si se proporciona
        if (dto.containerGroupId !== undefined) {
            if (dto.containerGroupId) {
                const container = await this.prisma.organizationalGroup.findUnique({
                    where: { id: dto.containerGroupId },
                    select: {
                        id: true,
                        groupType: true,
                        hierarchyLevel: true,
                        areaId: true
                    }
                });

                if (!container) {
                    throw new NotFoundException('The specified container group does not exist');
                }

                if (container.groupType !== 'CONTAINER') {
                    throw new BadRequestException(
                        `Only CONTAINER groups can contain other groups. ` +
                        `The specified container has type: ${container.groupType}`
                    );
                }

                const levelToValidate = dto.hierarchyLevel !== undefined ? dto.hierarchyLevel : currentGroup.hierarchyLevel;

                if (levelToValidate < container.hierarchyLevel) {
                    throw new BadRequestException(
                        `Contained groups cannot be at a lower hierarchy level than their container. ` +
                        `Container is at level ${container.hierarchyLevel}, current/new level is ${levelToValidate}.`
                    );
                }

                // Herencia automática de área del contenedor (si no se especificó explícitamente)
                if (container.areaId && dto.areaId === undefined) {
                    dto.areaId = container.areaId;
                }
            }
        }

        // PASO 3: VALIDAR ÁREA - SOLO SI REALMENTE ESTÁ CAMBIANDO
        if (dto.areaId !== undefined) {
            // Validar que el área existe
            if (dto.areaId) {
                await this.validateAreaExists(dto.areaId);
            }

            // ✅ NUEVA VALIDACIÓN: Solo validar hijos si el área REALMENTE CAMBIÓ
            const areaChanged = dto.areaId !== currentGroup.areaId;

            if (areaChanged && currentGroup.children && currentGroup.children.length > 0) {
                throw new BadRequestException(
                    `Cannot change area of a group that has ${currentGroup.children.length} child group(s). ` +
                    `Please remove or reassign child groups first, or update children's areas in cascade.`
                );
            }

            // Validar coherencia con contenedor/padre SOLO SI CAMBIÓ
            if (areaChanged) {
                const containerToCheck = dto.containerGroupId !== undefined
                    ? (dto.containerGroupId ? await this.prisma.organizationalGroup.findUnique({
                        where: { id: dto.containerGroupId },
                        select: { areaId: true }
                    }) : null)
                    : currentGroup.containerGroup;

                if (containerToCheck?.areaId) {
                    if (dto.areaId !== containerToCheck.areaId) {
                        throw new BadRequestException(
                            `Cannot change area to a different one than container's area. ` +
                            `Container area ID: ${containerToCheck.areaId}, you provided: ${dto.areaId}.`
                        );
                    }
                } else if (currentGroup.parent?.areaId) {
                    if (dto.areaId !== currentGroup.parent.areaId) {
                        throw new BadRequestException(
                            `Cannot change area to a different one than parent's area. ` +
                            `Parent area ID: ${currentGroup.parent.areaId}, you provided: ${dto.areaId}.`
                        );
                    }
                }
            }
        }

        // PASO 4: Validar padre si se proporciona
        if (dto.parentId !== undefined) {
            if (dto.parentId) {
                const parent = await this.prisma.organizationalGroup.findUnique({
                    where: { id: dto.parentId },
                    select: {
                        id: true,
                        hierarchyLevel: true,
                        areaId: true
                    }
                });

                if (!parent) {
                    throw new NotFoundException('The specified parent group does not exist');
                }

                const levelToValidate = dto.hierarchyLevel !== undefined ? dto.hierarchyLevel : currentGroup.hierarchyLevel;

                if (levelToValidate < parent.hierarchyLevel) {
                    throw new BadRequestException(
                        `Child cannot be at a lower hierarchy level than parent. ` +
                        `Parent is at level ${parent.hierarchyLevel}, current/new level is ${levelToValidate}.`
                    );
                }

                if (levelToValidate > parent.hierarchyLevel + 3) {
                    throw new BadRequestException(
                        `Child level too high. Maximum allowed: ${parent.hierarchyLevel + 3}.`
                    );
                }

                const containerGroupId = dto.containerGroupId !== undefined ? dto.containerGroupId : currentGroup.containerGroupId;

                if (parent.areaId && !containerGroupId) {
                    const areaToValidate = dto.areaId !== undefined ? dto.areaId : currentGroup.areaId;
                    if (areaToValidate !== parent.areaId) {
                        throw new BadRequestException(
                            `Cannot change to a parent with different area (no container override). ` +
                            `Parent area ID: ${parent.areaId}, current/new area ID: ${areaToValidate}.`
                        );
                    }
                }
            } else {
                if (dto.hierarchyLevel !== undefined && dto.hierarchyLevel !== 0) {
                    throw new BadRequestException(
                        `Groups without parent must be level 0. You provided level ${dto.hierarchyLevel}.`
                    );
                }
            }
        }

        // PASO 5: Validar nivel jerárquico si cambia (sin padre/contenedor)
        if (dto.hierarchyLevel !== undefined && dto.parentId === undefined && dto.containerGroupId === undefined) {
            if (currentGroup.parent) {
                if (dto.hierarchyLevel < currentGroup.parent.hierarchyLevel) {
                    throw new BadRequestException(
                        `Cannot change hierarchy level below parent's level. ` +
                        `Parent is at level ${currentGroup.parent.hierarchyLevel}.`
                    );
                }

                if (dto.hierarchyLevel > currentGroup.parent.hierarchyLevel + 3) {
                    throw new BadRequestException(
                        `Cannot change hierarchy level too high. Maximum allowed: ${currentGroup.parent.hierarchyLevel + 3}.`
                    );
                }
            } else {
                if (dto.hierarchyLevel !== 0) {
                    throw new BadRequestException(
                        `Cannot change hierarchy level. Groups without parent must remain at level 0.`
                    );
                }
            }

            if (currentGroup.containerGroup && dto.hierarchyLevel < currentGroup.containerGroup.hierarchyLevel) {
                throw new BadRequestException(
                    `Cannot change hierarchy level below container's level. ` +
                    `Container is at level ${currentGroup.containerGroup.hierarchyLevel}.`
                );
            }
        }

        // PASO 6: Validar nombres duplicados
        if (dto.name) {
            const duplicate = await this.prisma.organizationalGroup.findFirst({
                where: {
                    id: { not: id },
                    name: dto.name,
                    hierarchyLevel: dto.hierarchyLevel ?? currentGroup.hierarchyLevel,
                    areaId: dto.areaId !== undefined ? dto.areaId : currentGroup.areaId,
                    containerGroupId: dto.containerGroupId !== undefined ? dto.containerGroupId : currentGroup.containerGroupId
                }
            });

            if (duplicate) {
                throw new BadRequestException(
                    `A group named "${dto.name}" already exists at this level/area/container.`
                );
            }
        }
    }

    private async validateAreaExists(areaId: string): Promise<void> {
        const area = await this.prisma.area.findUnique({ where: { id: areaId } });

        if (!area) throw new NotFoundException('The specified area does not exist');
    }

    private async validateParentExists(parentId: string): Promise<void> {
        const parent = await this.prisma.organizationalGroup.findUnique({ where: { id: parentId } });

        if (!parent) throw new NotFoundException('The specified parent group does not exist');
    }

    private async validateUsersExist(userIds: string[]): Promise<void> {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } }
        });

        if (users.length !== userIds.length) throw new BadRequestException('One or more users do not exist');
    }




    private async findGroupById(
        id: string,
        includeMembers: boolean = false,
        includeChildren: boolean = false
    ): Promise<any> {
        const include: any = this.getGroupIncludes();

        if (includeMembers) {
            include.members = {
                include: {
                    user: {
                        select: this.USER_SELECT
                    }
                }
            }
        }

        if (includeChildren) {
            include.children = true;
        }

        const group = await this.prisma.organizationalGroup.findUnique({
            where: { id },
            include
        });

        if (!group) throw new NotFoundException("Group organizational not found");

        return group;

    }

    private async addMemberToGroup(groupId: string, userId: string, tx?: any): Promise<any> {
        const client = tx || this.prisma;

        return client.userOrganizationalGroup.upsert({
            where: {
                userId_groupId: { userId, groupId }
            },
            create: { userId, groupId },
            update: {},
            include: {
                user: {
                    select: this.USER_SELECT
                }
            }
        })
    }


    private getGroupIncludes() {
        return {
            area: true,
            parent: true,
            containerGroup: { select: { id: true, name: true } },
            _count: { select: { members: true, containedGroups: true } }
        }
    }

    private getHierarchyIncludes() {
        return {
            area: true,
            children: {
                include: {
                    children: {
                        include: {
                            children: true,
                            members: {
                                include: {
                                    user: {
                                        select: this.USER_SELECT
                                    }
                                }
                            }
                        }
                    },
                    members: {
                        include: {
                            user: {
                                select: this.USER_SELECT
                            }
                        }
                    }
                }
            },
            members: {
                include: {
                    user: {
                        select: this.USER_SELECT
                    }
                }
            }
        };
    }



    private async buildHierarchyChain(groupId: string): Promise<HierarchyChainItem[]> {
        const chain: HierarchyChainItem[] = [];
        let currentGroupId: string | null = groupId;

        while (currentGroupId) {
            const group = await this.prisma.organizationalGroup.findUnique({
                where: { id: currentGroupId },
                select: {
                    name: true,
                    hierarchyLevel: true,
                    groupType: true,
                    parentId: true
                }
            });

            if (!group) break;

            chain.unshift({
                name: group.name,
                level: group.hierarchyLevel,
                type: group.groupType as 'CONTAINER' | 'LEADERSHIP' | 'OPERATIONAL'
            });

            currentGroupId = group.parentId;
        }

        return chain;
    }


    private async prepareLdapAssignmentPayload(
        groupId: string,
        userEmails: string[]
    ): Promise<LdapOrgGroupAssignmentPayload> {
        const group = await this.prisma.organizationalGroup.findUnique({
            where: { id: groupId },
            include: {
                area: { select: { name: true } },
                containerGroup: { select: { name: true } }
            }
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }
        const hierarchyChain = await this.buildHierarchyChain(groupId);

        return {
            group_name: group.name,
            group_type: group.groupType as 'CONTAINER' | 'LEADERSHIP' | 'OPERATIONAL',
            hierarchy_level: group.hierarchyLevel,
            area: group.area?.name,
            container_group: group.containerGroup?.name,
            hierarchy_chain: hierarchyChain,
            users: userEmails
        };
    }

    private async prepareLdapRemovalPayload(
        groupId: string,
        userEmails: string[]
    ): Promise<LdapOrgGroupRemovalPayload> {
        const group = await this.prisma.organizationalGroup.findUnique({
            where: { id: groupId },
            include: {
                area: { select: { name: true } }
            }
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return {
            group_name: group.name,
            group_type: group.groupType as 'CONTAINER' | 'LEADERSHIP' | 'OPERATIONAL',
            area: group.area?.name,
            users: userEmails
        };
    }







}
