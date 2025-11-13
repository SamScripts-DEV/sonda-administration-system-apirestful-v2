import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { HolidayService } from './holiday.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { JwtAuthGuard } from '../auth/auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('holidays')
export class HolidayController {
    constructor(private readonly holidayService: HolidayService) {}

    @Get()
    async findAll(@Query('year') year?: string) {
        const y = year ? Number(year) : undefined;
        return this.holidayService.findAll(y);
    }

    @Get("list-per-year")
    async listholidaysPerDay(@Query('year') year?: string) {
        const y = year ? Number(year) : undefined;
        return this.holidayService.getWeebHookFormat(y);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.holidayService.findOne(id);
    }

    @Post()
    async create(@Body() holiday: CreateHolidayDto) {
        return this.holidayService.create(holiday);
    }

    //Method to update an existing holiday
    @Post('sync-external')
    async syncExternalHolidays(@Query('year') year: string){
        const y = Number(year) || new Date().getFullYear();
        return this.holidayService.syncHolidaysIfNotExist(y);
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
