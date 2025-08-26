import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Controller('holiday')
export class HolidayController {
    constructor(private readonly holidayService: HolidayService) {}

    @Get()
    async findAll() {
        return this.holidayService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.holidayService.findOne(id);
    }

    @Post()
    async create(@Body() holiday: CreateHolidayDto) {
        return this.holidayService.create(holiday);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() holiday: Partial<CreateHolidayDto>) {
        return this.holidayService.update(id, holiday);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.holidayService.remove(id);
    }
}
