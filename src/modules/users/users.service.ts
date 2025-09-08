import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindAllForSelectType, UserWithRelationsDto } from './types/users-types';
import { hashPassword } from 'src/utils/password.util';
import { uploadImage } from 'src/utils/cloudinary.util';
import { UserLdapSyncService } from './user-ldap-sync.service';
import { User } from '@prisma/client';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';


@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userLdapSyncService: UserLdapSyncService
    ) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------

    //Function to find all users for select dropdown,only returning necessary fields
    async findAllForSelect(): Promise<Array<FindAllForSelectType>> {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                imageUrl: true
            }
        });
        return users.map(user => ({
            id: user.id,
            fullNames: `${user.firstName} ${user.lastName}`,
            imageUrl: user.imageUrl
        }));
    }

    //Function to get all users with formatted data
    async findAllUsers(): Promise<UserWithRelationsDto[]> {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true,
                email: true,
                username: true,
                phone: true,
                active: true,
                address: true,
                city: true,
                country: true,
                province: true,
                roles: { select: { role: { select: { id: true, name: true } } } },
                department: { select: { id: true, name: true } },
                areas: { include: { area: { select: { id: true, name: true } } } },
                roles_local: {
                    include: {
                        area: { select: { id: true, name: true } },
                        role: { select: { id: true, name: true } }
                    }
                },
                position: { select: { id: true, name: true } },
                imageUrl: true,
                createdAt: true,
            },
        });

        return users.map(user => this.formatUserWithRelations(user));
    }

    //Function to check if a user exists by username, for validation purposes
    async findOneByUsername(username: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: { id: true }
        });
        return !!user;
    }

    //Function to get one user by id, with relations
    async findOneById(id: string): Promise<UserWithRelationsDto> {
        const user = await this.getUserWithRelations(id);
        if (!user) throw new NotFoundException('User not found');
        return this.formatUserWithRelations(user);
    }

    async findOneByUsernameOrEmail(identifier: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: identifier },
                    { email: identifier }
                ]
            },
            include: {
                areas: { include: { area: true } },
                roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
                roles_local: {
                    include: {
                        area: true,
                        role: { include: { permissions: { include: { permission: true } } } }
                    }
                },
                department: true,
                position: true
            }

        });

        return user;
    }

    // Function to get roles assigned to a user
    async getRolesForUser(userId: string) {
        await this.ensureUserExist(userId);


        const globalRoles = await this.prisma.userRole.findMany({
            where: { userId },
            include: { role: { select: { id: true, name: true, scope: true } } }
        });


        const localRoles = await this.prisma.userRoleLocal.findMany({
            where: { userId },
            include: {
                role: { select: { id: true, name: true, scope: true } },
                area: { select: { id: true, name: true } }
            }
        });

        return {
            globalRoles: globalRoles.map(r => ({
                id: r.role.id,
                name: r.role.name,
                scope: r.role.scope
            })),
            localRoles: localRoles.map(lr => ({
                areaId: lr.area.id,
                areaName: lr.area.name,
                roleId: lr.role.id,
                roleName: lr.role.name,
                scope: lr.role.scope
            }))
        };
    }


    //Function to get Assignable Roles for a user
    async getAssignableRolesForUser(userId: string) {
        await this.ensureUserExist(userId);

        const [globalRoles, userGlobalRoles] = await Promise.all([
            this.prisma.role.findMany({ where: { scope: 'GLOBAL' } }),
            this.prisma.userRole.findMany({ where: { userId } })
        ]);

        const assignedGlobalRoleIds = new Set(userGlobalRoles.map(r => r.roleId));
        const assignableGlobalRoles = globalRoles.filter(r => !assignedGlobalRoleIds.has(r.id));

        const [userAreas, userLocalRoles] = await Promise.all([
            this.prisma.userArea.findMany({ where: { userId }, include: { area: true } }),
            this.prisma.userRoleLocal.findMany({ where: { userId } })
        ]);

        const assignedLocal = new Set(userLocalRoles.map(r => `${r.roleId}:${r.areaId}`));

        const areaIds = userAreas.map(ua => ua.areaId);
        const areaRoles = await this.prisma.areaRole.findMany({
            where: { areaId: { in: areaIds } },
            include: { role: true, area: true }
        })

        const localRolesByArea: Record<string, { areaId: string; areaName: string; roles: { roleId: string; roleName: string }[] }> = {};
        for (const ar of areaRoles) {
            const key = `${ar.areaId}:${ar.roleId}`;
            if (!assignedLocal.has(key)) {
                if (!localRolesByArea[ar.areaId]) {
                    localRolesByArea[ar.areaId] = {
                        areaId: ar.areaId,
                        areaName: ar.area.name,
                        roles: []
                    };
                }
                localRolesByArea[ar.areaId].roles.push({
                    roleId: ar.roleId,
                    roleName: ar.role.name
                });
            }

        }
        return {
            globalRoles: assignableGlobalRoles.map(r => ({ id: r.id, name: r.name })),
            localRoles: Object.values(localRolesByArea)
        };


    }


    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new user accounts or related resources)
    //--------------------------------------------------------------------------------------

    //Function to create a new user
    async create(user: CreateUserDto, file?: Express.Multer.File): Promise<UserWithRelationsDto> {
        await this.validateRequiredFields(user);

        if (await this.userExists(user.email)) {
            throw new BadRequestException('User with this email already exists.');
        }

        await this.validateRelations(user)

        user.passwordHash = await hashPassword(user.passwordHash)
        user.imageUrl = await this.handleImage(file);


        const { areaIds, ...userData } = user;

        this.normalizeBooleanFields(userData);

        const createdUser = await this.prisma.user.create({
            data: { ...userData },
            include: { department: true, areas: { include: { area: true } }, position: true }
        });

        if (areaIds && areaIds.length > 0) {
            await Promise.all(
                areaIds.map(areaId =>
                    this.prisma.userArea.create({ data: { userId: createdUser.id, areaId } })
                )
            );
        }


        const userWithRelations = await this.getUserWithRelations(createdUser.id);

        const userFormatted = this.formatUserWithRelations(userWithRelations);

        const ldapPayload = this.userLdapSyncService.buildLdapPayload(userFormatted, user.passwordHash);

        try {
            await this.userLdapSyncService.syncUserToLdap(ldapPayload);

        } catch (error) {
            await this.prisma.user.delete({ where: { id: createdUser.id } });
            throw new BadRequestException('Error syncing user to LDAP');
        }

        return userFormatted;
    }

    //Function to add a rol to user
    async assignRolesToUser(
        userId: string,
        globalRoleIds: string[] = [],
        localRoles: { areaId: string; roleId: string }[] = []
    ): Promise<{ message: string }> {
        await this.ensureUserExist(userId);
        await this.assignGlobalRoles(this.prisma, userId, globalRoleIds);
        await this.assignLocalRoles(this.prisma, userId, localRoles);
        return { message: 'Roles assigned to user successfully' };
    }


    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing user information or settings)
    //--------------------------------------------------------------------------------------

    //Function to update an existing user
    async update(id: string, user: Partial<CreateUserDto>, file?: Express.Multer.File): Promise<UserWithRelationsDto> {
        const existingUser = await this.prisma.user.findUnique({ where: { id }, include: { department: true, areas: true, position: true } });
        if (!existingUser) throw new NotFoundException('User not found');

        await this.validateRelationsPresents(user);

        if (user.areaIds) {
            await this.prisma.userArea.deleteMany({ where: { userId: id } });
            await Promise.all(
                user.areaIds.map(areaId =>
                    this.prisma.userArea.create({ data: { userId: id, areaId } })
                )
            )
        }

        const dataToUpdate = await this.buildUpdateData(user, file);
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: dataToUpdate,
            include: {
                department: true,
                areas: { include: { area: true } },
                position: true,
                roles: { select: { role: { select: { name: true } } } },
                roles_local: {
                    include: {
                        area: { select: { name: true } },
                        role: { select: { name: true } }
                    }
                }
            },
        });

        return this.formatUserWithRelations(updatedUser);
    }

    //Function to update role for a user
    async updateUserRoles(
        userId: string,
        globalRoleIds: string[] = [],
        localRoles: { areaId: string; roleId: string }[] = []
    ): Promise<{ message: string }> {
        if (!userId) throw new BadRequestException('User ID is required');
        await this.ensureUserExist(userId);

        await this.prisma.$transaction(async (tx) => {
            await tx.userRole.deleteMany({ where: { userId } });
            await tx.userRoleLocal.deleteMany({ where: { userId } });

            await this.assignGlobalRoles(tx, userId, globalRoleIds);
            await this.assignLocalRoles(tx, userId, localRoles);

        });

        return { message: 'User roles updated successfully' };
    }

    //Function to update only user password
    async insertNewPasswordInDB(id: string, hashedPassword: string): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: { passwordHash: hashedPassword }
        });
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Mark user accounts as inactive or deleted without physically removing them from the database)
    //--------------------------------------------------------------------------------------

    //Function to delete a user by id (mark as inactive)
    async remove(id: string): Promise<{ message: string }> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        await this.prisma.user.update({
            where: { id },
            data: { active: false }
        });
        return { message: 'User deleted successfully' };
    }


    //Function to remove a role from a user
    async removeRoleFromUser(
        userId: string,
        roleId: string,
        areaId?: string // Opcional, solo para roles locales
    ): Promise<{ message: string }> {
        if (!userId || !roleId) throw new BadRequestException('User ID and Role ID are required');
        const role = await this.ensureUserAndRoleExist(userId, roleId);

        if (role.scope === 'GLOBAL') {
            await this.removeGlobalRole(userId, roleId);
            return { message: 'Global role removed from user successfully' };
        } else if (role.scope === 'LOCAL') {
            if (!areaId) throw new BadRequestException('areaId is required for local roles');
            await this.removeLocalRole(userId, roleId, areaId);
            return { message: 'Local role removed from user successfully' };
        } else {
            throw new BadRequestException('Unknown role scope');
        }
    }

    //--------------------------------------------------------------------------------------
    // PRIVATE HELPER FUNCTIONS (Used internally to validate data, handle relations, or perform other utility tasks)
    //--------------------------------------------------------------------------------------

    //Function to validate required fields for user creation
    private async validateRequiredFields(user: CreateUserDto) {
        const required = ['firstName', 'lastName', 'username', 'email', 'passwordHash', 'phone', 'areaIds', 'departmentId', 'nationalId'];
        for (const field of required) {
            if (!user[field]) throw new BadRequestException(`Field ${field} is required.`);
        }
    }

    //Function to validate that the relations (department, area, position) exist in the database, and the id is valid and not null
    private async validateRelations(user: CreateUserDto) {
        const [department, position] = await Promise.all([
            this.prisma.department.findUnique({ where: { id: user.departmentId } }),
            user.positionId ? this.prisma.position.findUnique({ where: { id: user.positionId } }) : Promise.resolve(null)
        ]);
        if (!department) throw new BadRequestException('Invalid department ID');
        if (user.positionId && !position) throw new BadRequestException('Invalid position ID');
        for (const areaId of user.areaIds) {
            const area = await this.prisma.area.findUnique({ where: { id: areaId } });
            if (!area) throw new BadRequestException(`Invalid area ID: ${areaId}`);
        }
    }

    //Function to handle image upload and return the image URL in cloudinary
    private async handleImage(file?: Express.Multer.File): Promise<string | undefined> {
        if (!file) return undefined;
        const result = await uploadImage(file);
        return result.secure_url;
    }

    //Function to check if a user already exists in the database by email
    private async userExists(email: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({ where: { email } })
        return !!user;
    }

    //Function to validate the relations present or sent, only for update operations
    private async validateRelationsPresents(user: Partial<CreateUserDto>) {
        if (user.departmentId) {
            const department = await this.prisma.department.findUnique({ where: { id: user.departmentId } });
            if (!department) throw new BadRequestException('Invalid department ID');
        }
        if (user.areaIds && Array.isArray(user.areaIds)) {
            for (const areaId of user.areaIds) {
                const area = await this.prisma.area.findUnique({ where: { id: areaId } });
                if (!area) throw new BadRequestException(`Invalid area ID: ${areaId}`);
            }
        }
        if (user.positionId) {
            const position = await this.prisma.position.findUnique({ where: { id: user.positionId } });
            if (!position) throw new BadRequestException('Invalid position ID');
        }
    }

    // Helper to build the update object
    private async buildUpdateData(user: Partial<CreateUserDto>, file?: Express.Multer.File) {
        const data: any = { ...user };
        if (user.passwordHash) data.passwordHash = await hashPassword(user.passwordHash);
        if (file) data.imageUrl = await this.handleImage(file);
        return data;
    }

    //Function to format the user with relations
    private formatUserWithRelations(user: any): UserWithRelationsDto {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            nationalId: user.nationalId,
            email: user.email,
            username: user.username,
            phone: user.phone,
            active: user.active ?? true,
            address: user.address ?? null,
            city: user.city ?? null,
            country: user.country ?? null,
            province: user.province ?? null,
            roles: {
                global: user.roles?.map(r => r.role.name) ?? [],
                local: user.roles_local?.map(rl => ({
                    area: rl.area.name,
                    role: rl.role.name
                })) ?? []
            },
            rolesDetailed: {
                global: user.roles?.map(r => ({
                    id: r.role.id,
                    name: r.role.name
                })) ?? [],
                local: user.roles_local?.map(rl => ({
                    area: {
                        id: rl.area.id,
                        name: rl.area.name
                    },
                    role: {
                        id: rl.role.id,
                        name: rl.role.name
                    }
                })) ?? []
            },
            department: user.department?.name ?? null,
            departmentId: user.department?.id ?? null,
            areas: user.areas?.map(ua => ua.area.name) ?? [],
            areasDetailed: user.areas?.map(ua => ({
                id: ua.area.id,
                name: ua.area.name
            })) ?? [],
            position: user.position?.name ?? null,
            positionId: user.position?.id ?? null,
            imageUrl: user.imageUrl ?? null,
            createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        };
    }

    private async ensureUserExist(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
    }

    private async ensureRoleExist(roleId: string) {
        const role = await this.prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new NotFoundException('Role not found');
        return role;
    }

    private async ensureUserAndRoleExist(userId: string, roleId: string) {
        await this.ensureUserExist(userId);
        const role = await this.ensureRoleExist(roleId);
        return role;
    }

    private async userHasRoleGlobal(userId: string, roleId: string): Promise<boolean> {
        const userRole = await this.prisma.userRole.findUnique({
            where: { userId_roleId: { userId, roleId } }
        });
        return !!userRole;
    }

    private async userHasLocalRole(userId: string, roleId: string, areaId: string): Promise<boolean> {
        const userRoleLocal = await this.prisma.userRoleLocal.findFirst({
            where: { userId, roleId, areaId }
        });
        return !!userRoleLocal;
    }

    private async getUserWithRelations(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true,
                email: true,
                username: true,
                phone: true,
                active: true,
                address: true,
                city: true,
                country: true,
                province: true,
                roles: { select: { role: { select: { id: true, name: true } } } },
                department: { select: { id: true, name: true } },
                areas: { include: { area: { select: { id: true, name: true } } } },
                roles_local: {
                    include: {
                        area: { select: { id: true, name: true } },
                        role: { select: { id: true, name: true } }
                    }
                },
                position: { select: { id: true, name: true } },
                imageUrl: true,
                createdAt: true,
            }
        });
    }

    private async assignGlobalRoles(prismaClient: any, userId: string, globalRoleIds: string[]) {
        if (!globalRoleIds.length) return;
        const globalRoles = await prismaClient.role.findMany({
            where: { id: { in: globalRoleIds }, scope: 'GLOBAL' }
        });
        const validGlobalRoleIds = new Set(globalRoles.map(r => r.id));
        for (const roleId of globalRoleIds) {
            if (!validGlobalRoleIds.has(roleId)) continue;
            const exists = await prismaClient.userRole.findUnique({
                where: { userId_roleId: { userId, roleId } }
            });
            if (!exists) {
                await prismaClient.userRole.create({ data: { userId, roleId } });
            }
        }
    }

    private async assignLocalRoles(prismaClient: any, userId: string, localRoles: { areaId: string; roleId: string }[]) {
        if (!localRoles.length) return;
        const localRoleIds = localRoles.map(lr => lr.roleId);
        const areaIds = localRoles.map(lr => lr.areaId);
        const areaRoles = await prismaClient.areaRole.findMany({
            where: {
                areaId: { in: areaIds },
                roleId: { in: localRoleIds }
            }
        });
        const validAreaRoleSet = new Set(areaRoles.map(ar => `${ar.areaId}:${ar.roleId}`));
        for (const { areaId, roleId } of localRoles) {
            if (!validAreaRoleSet.has(`${areaId}:${roleId}`)) continue;
            const exists = await prismaClient.userRoleLocal.findFirst({ where: { userId, areaId, roleId } });
            if (!exists) {
                await prismaClient.userRoleLocal.create({ data: { userId, areaId, roleId } });
            }
        }
    }

    private async removeGlobalRole(userId: string, roleId: string) {
        if (!(await this.userHasRoleGlobal(userId, roleId))) throw new BadRequestException('User does not have this global role');
        await this.prisma.userRole.delete({
            where: { userId_roleId: { userId, roleId } }
        });
    }

    private async removeLocalRole(userId: string, roleId: string, areaId: string) {
        if (!(await this.userHasLocalRole(userId, roleId, areaId))) throw new BadRequestException('User does not have this local role in the specified area');
        await this.prisma.userRoleLocal.deleteMany({ where: { userId, areaId, roleId } });
    }

    private normalizeBooleanFields(userData: any) {
        if (typeof userData.active === 'string') {
            userData.active = userData.active === 'true';
        }
        return userData;
    }
}

