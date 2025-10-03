import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-rol.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { ProfileGuard } from 'src/common/guards/profile.guard';

@UseGuards(JwtAuthGuard, ProfileGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------

    @Get()
    @Permissions("role.read")
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @Permissions("role.read")
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.rolesService.findOne(id);
    }

    //Endpoint to get permissions for a role
    @Get(':roleId/permissions')
    @Permissions("role.read")
    getPermissions(@Param('roleId') roleId: string) {
        return this.rolesService.getPermissionsForRole(roleId);
    }


    @Get(':roleId/assignable-users')
    @Permissions("role.read")
    getAssignableUsers(@Param('roleId') roleId: string) {
        return this.rolesService.getAssignableUsersForRole(roleId);
    }


    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new role or related resources)
    //--------------------------------------------------------------------------------------

    @Post()
    @Permissions("role.create")
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    //Endpoint to add permission to a role
    @Post(':roleId/permissions')
    @Permissions("role.create", "role.assign.permissions")
    addPermission(@Param('roleId') roleId: string, @Body('permissionIds') permissionIds: string[]) {
        return this.rolesService.addPermissionToRole(roleId, permissionIds);
    }

    //Endpoint to add users to a role
    @Post(':roleId/users')
    @Permissions("role.create", "role.assign.users")
    assignUsersToRole(
        @Param('roleId', new ParseUUIDPipe()) roleId: string,
        @Body('userIds') userIds: string[],
        @Body('areaId') areaId?: string
    ) {
        return this.rolesService.assignUsersToRole(roleId, userIds, areaId);
    }


    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing role information or settings)
    //--------------------------------------------------------------------------------------

    @Put(':id')
    @Permissions('role.update', 'role.create')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateRoleDto: Partial<CreateRoleDto>) {
        return this.rolesService.update(id, updateRoleDto);
    }

    //Endpoint to update permissions for a role
    @Post(':roleId/permissions')
    @Permissions('role.update', 'role.create')
    updatePermissions(@Param('roleId') roleId: string, @Body('permissionIds') permissionIds: string[]) {
        return this.rolesService.updateRolePermissions(roleId, permissionIds);
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to remove existing role information or settings)
    //--------------------------------------------------------------------------------------

    @Delete(':id/delete')
    @Permissions('role.delete')
    delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.rolesService.remove(id);
    }

    
    //Endpoint to remove permission from a role

    @Delete(':roleId/permissions/:permissionId')
    @Permissions('role.delete', 'permission.delete', 'role.assign.permissions')
    removePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
        return this.rolesService.removePermissionFromRole(roleId, permissionId);
    }

    @Delete(':roleId/users/:userId')
    @Permissions('role.delete', 'user.delete', 'role.assign.users')
    removeUserFromRole(
        @Param('roleId', new ParseUUIDPipe()) roleId: string,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query('areaId') areaId?: string
    ) {
        return this.rolesService.removeUserFromRole(roleId, userId, areaId);
    }
}
