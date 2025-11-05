import { Controller, Get } from '@nestjs/common';
import { AreaRoleService } from './area-role.service';

@Controller('area-role')
export class AreaRoleController {
    constructor(private readonly areaRoleService: AreaRoleService){}

    @Get()
    findAll(){
        return this.areaRoleService.findAll()
    }
}
