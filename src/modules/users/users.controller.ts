import { BadRequestException, Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
    findAll() {
        return this.usersService.findAllUsers();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findOneById(id);
    }


    @Get(':userId/roles')
    getRoles(@Param('userId', new ParseUUIDPipe()) userId: string) {
        return this.usersService.getRolesForUser(userId);
    }



    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new user accounts)
    //--------------------------------------------------------------------------------------
    @Post()
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
    async updateUserRoles(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body('globalRoleIds') globalRoleIds: string[],
        @Body('localRoles') localRoles: { areaId: string; roleId: string }[]
    ) {
        return await this.usersService.updateUserRoles(userId, globalRoleIds, localRoles);
    }

    @Patch(':id/activate')
    async activateUser(@Param('id', new ParseUUIDPipe()) id: string) {
        return await this.usersService.activate(id);
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to delete or deactivate users)
    //--------------------------------------------------------------------------------------
    @Delete(':id/delete')
    async remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return await this.usersService.remove(id)
    }

    // Quitar un rol de un usuario
    @Delete(':userId/roles/:roleId')
    removeRole(@Param('userId', new ParseUUIDPipe()) userId: string, @Param('roleId', new ParseUUIDPipe()) roleId: string) {
        return this.usersService.removeRoleFromUser(userId, roleId);
    }
}
