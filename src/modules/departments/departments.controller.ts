import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department';

@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) {}

    // GET all departments
    @Get()
    findAll() {
        return this.departmentsService.findAll();
    }

    // GET one department
    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.departmentsService.findOne(id);
    }

    // CREATE department
    @Post()
    create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }

    // UPDATE department
    @Post(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() updateDepartmentDto: Partial<CreateDepartmentDto>) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    // DELETE department
    @Delete(':id/delete')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.departmentsService.remove(id);
    }
}
