import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('holidays')
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
