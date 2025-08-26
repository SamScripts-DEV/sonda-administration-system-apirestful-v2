import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
    constructor(private readonly permissionsService: PermissionsService) {}

    //--------------------------------------------------------------------------------------
    // GET Methods (Used to retrieve data from the server)
    //--------------------------------------------------------------------------------------

    @Get()
    findAll() {
        return this.permissionsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.permissionsService.findOne(id);
    }

    //--------------------------------------------------------------------------------------
    // POST Methods (Used to create new permission or related resources)
    //--------------------------------------------------------------------------------------

    @Post()
    create(@Body() createPermissionDto: CreatePermissionDto) {
        return this.permissionsService.create(createPermissionDto);
    }

    //--------------------------------------------------------------------------------------
    // PUT Methods (Used to update existing permission information or settings)
    //--------------------------------------------------------------------------------------

    @Post(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updatePermissionDto: Partial<CreatePermissionDto>) {
        return this.permissionsService.update(id, updatePermissionDto);
    }

    //--------------------------------------------------------------------------------------
    // DELETE Methods (Used to remove existing permission information or settings)
    //--------------------------------------------------------------------------------------

    @Post(':id/delete')
    delete(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.permissionsService.remove(id);
    }
}
