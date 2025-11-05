import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ShiftTypeService } from './shift-type.service';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto';

@Controller('shift-type')
export class ShiftTypeController {
    constructor (private readonly shiftTypeService: ShiftTypeService) {}

    @Get()
    findAll() {
        return this.shiftTypeService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.shiftTypeService.findOne(id)
    }
    

    
    @Post()
    create(@Body() dto: CreateShiftTypeDto) {
        return this.shiftTypeService.create(dto)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<CreateShiftTypeDto>) {
        return this.shiftTypeService.update(id, dto)
    }

    @Patch('activate/:id')
    activate(@Param('id') id: string) {
        return this.shiftTypeService.activate(id)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.shiftTypeService.remove(id)
    }

    
}
