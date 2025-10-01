import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-rol.dto';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------

    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.rolesService.findOne(id);
    }

    //Endpoint to get permissions for a role
    @Get(':roleId/permissions')
    getPermissions(@Param('roleId') roleId: string) {
        return this.rolesService.getPermissionsForRole(roleId);
    }


    @Get(':roleId/assignable-users')
    getAssignableUsers(@Param('roleId') roleId: string) {
        return this.rolesService.getAssignableUsersForRole(roleId);
    }


    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new role or related resources)
    //--------------------------------------------------------------------------------------

    @Post()
    create(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.create(createRoleDto);
    }

    //Endpoint to add permission to a role
    @Post(':roleId/permissions')
    addPermission(@Param('roleId') roleId: string, @Body('permissionIds') permissionIds: string[]) {
        return this.rolesService.addPermissionToRole(roleId, permissionIds);
    }

    //Endpoint to add users to a role
    @Post(':roleId/users')
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
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateRoleDto: Partial<CreateRoleDto>) {
        return this.rolesService.update(id, updateRoleDto);
    }

    //Endpoint to update permissions for a role
    @Post(':roleId/permissions')
    updatePermissions(@Param('roleId') roleId: string, @Body('permissionIds') permissionIds: string[]) {
        return this.rolesService.updateRolePermissions(roleId, permissionIds);
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to remove existing role information or settings)
    //--------------------------------------------------------------------------------------

    @Delete(':id/delete')
    delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.rolesService.remove(id);
    }

    
    //Endpoint to remove permission from a role
    @Delete(':roleId/permissions/:permissionId')
    removePermission(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
        return this.rolesService.removePermissionFromRole(roleId, permissionId);
    }

    @Delete(':roleId/users/:userId')
    removeUserFromRole(
        @Param('roleId', new ParseUUIDPipe()) roleId: string,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query('areaId') areaId?: string
    ) {
        return this.rolesService.removeUserFromRole(roleId, userId, areaId);
    }
}
