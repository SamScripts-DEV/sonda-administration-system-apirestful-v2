import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ShiftRosterService } from './shift-roster.service';
import { CreateShiftRosterDto } from './dto/create-shift-roster.dto';
import { UpdateShiftRosterDto } from './dto/update-shift-roster.dto';

@Controller('shift-roster')
export class ShiftRosterController {

    constructor(private readonly shiftRosterService: ShiftRosterService) {}


    @Get()
    findAll() {
        return this.shiftRosterService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.shiftRosterService.findOne(id)
    }

    @Post()
    create(@Body() dto: CreateShiftRosterDto) {
        return this.shiftRosterService.create(dto)
    }


    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateShiftRosterDto) {
        return this.shiftRosterService.update(id, dto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.shiftRosterService.remove(id)
    }






}
