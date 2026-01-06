import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, ParseUUIDPipe, Patch, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { userReadStrategies, userReadOneStrategies } from './strategies';
import { ProfileGuard } from 'src/common/guards/profile.guard';
import { UserChangePasswordDto } from './types/users-types';
import { MultiJwtGuard } from 'src/common/guards/multi-jwt.guard';

@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService
    ) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve user data)
    //--------------------------------------------------------------------------------------
    @Get('for-select')
    findAllForSelect() {
        return this.usersService.findAllForSelect();
    }

    @Get()
    @Permissions('user.read', 'user.area.read')
    findAll(@Req() req) {
        const user = req.user;
        const effective = user.effectivePermissions;

        const readPer = effective.find(p => p.module === 'user' && p.group === 'read') || effective.find(p => p.code === 'system.full_access');
        if (!readPer) throw new ForbiddenException('Insufficient permissions');

        const strategy = userReadStrategies[readPer.code];
        return strategy(this.usersService, user)
        //return this.usersService.findAllUsers();
    }

    @Get(':id')
    @Permissions('user.read', 'user.area.read')
    async findOne(@Req() req, @Param('id') id: string) {
        const user = req.user;
        const effective = user.effectivePermissions;

        const readPer = effective.find(p => p.module === 'user' && p.group === 'read') || effective.find(p => p.code === 'system.full_access');
        if (!readPer) throw new ForbiddenException('Insufficient permissions');

        const strategy = userReadOneStrategies[readPer.code];
        if (!strategy) throw new ForbiddenException('No strategy for this permission');
        return strategy(this.usersService, user, id);
    }


    @Get(':userId/roles')
    getRoles(@Param('userId', new ParseUUIDPipe()) userId: string) {
        return this.usersService.getRolesForUser(userId);
    }



    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new user accounts)
    //--------------------------------------------------------------------------------------
    @Post()
    @Permissions('user.create', 'user.area.create')
    @UseInterceptors(FileInterceptor('image', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
                return cb(new BadRequestException('Format not supported'), false);
            }
            cb(null, true);
        }
    }))
    async create(@Body() user: CreateUserDto, @UploadedFile() file?: Express.Multer.File) {
        return this.usersService.create(user, file);
    }


    @Post(':userId/assign-roles')
    @Permissions('user.create', 'user.update', 'user.area.update', 'user.roleglobal.assign', 'user.rolelocal.assign')
    async assignRolesToUser(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body('globalRoleIds') globalRoleIds: string[],
        @Body('localRoles') localRoles: { areaId: string; roleId: string }[]
    ) {
        return await this.usersService.assignRolesToUser(userId, globalRoleIds, localRoles);
    }


    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing user information)
    //--------------------------------------------------------------------------------------

    // This endpoint allows updating user information, including the image if provided.
    @Patch(':id')
    @Permissions('user.create', 'user.update', 'user.area.update')
    @UseInterceptors(FileInterceptor('image', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
                return cb(new BadRequestException('Format not supported'), false);
            }
            cb(null, true);
        }
    }))
    async update(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Body() user: Partial<CreateUserDto>,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return await this.usersService.update(id, user, file);
    }

    //This endpoint allows updating only the image of a user.
    @Patch(':id/uploaded-image')
    @Permissions('user.create', 'user.update', 'user.area.update')
    @UseInterceptors(FileInterceptor('image', {
        limits: {
            fileSize: 5 * 1024 * 1024, // 5 MB
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(jpeg|png|jpg)$/)) {
                return cb(new BadRequestException('Format not supported'), false);
            }
            cb(null, true);
        }
    }))
    async updateImage(
        @Param('id', new ParseUUIDPipe()) id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return await this.usersService.update(id, {}, file);
    }

    @Put(':userId/update-roles')
    @Permissions('user.create', 'user.update', 'user.area.update', 'user.roleglobal.assign', 'user.rolelocal.assign', 'user.roleglobal.read')
    async updateUserRoles(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body('globalRoleIds') globalRoleIds: string[],
        @Body('localRoles') localRoles: { areaId: string; roleId: string }[]
    ) {
        return await this.usersService.updateUserRoles(userId, globalRoleIds, localRoles);
    }

    @Patch(':id/activate')
    @Permissions('user.activate', 'user.desactivate', 'user.create', 'user.update', 'user.area.update')
    async activateUser(@Param('id', new ParseUUIDPipe()) id: string) {
        return await this.usersService.activate(id);
    }


    @Put('change-password')
    @UseGuards(MultiJwtGuard)
    async changePasswordByEmail(
        @Body('email') email: string,
        @Body() data: UserChangePasswordDto
    ) {
        return this.usersService.changePasswordByEmail(email, data);
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to delete or deactivate users)
    //--------------------------------------------------------------------------------------
    @Delete(':id/delete')
    @Permissions('user.delete')
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return await this.usersService.remove(id)
    }

    // Quitar un rol de un usuario

    @Delete(':userId/roles/:roleId')
    @Permissions('user.create', 'user.update', 'user.area.update', 'user.roleglobal.assign', 'user.rolelocal.assign')
    removeRole(@Param('userId', new ParseUUIDPipe()) userId: string, @Param('roleId', new ParseUUIDPipe()) roleId: string) {
        return this.usersService.removeRoleFromUser(userId, roleId);
    }
}
