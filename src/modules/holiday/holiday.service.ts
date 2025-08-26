import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HolidayResponse } from './types/holidays-types';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidayService {
    constructor(private readonly prisma: PrismaService) { }

    //GET Methods (Used to retrieve data from the server)
    async findAll(): Promise<HolidayResponse[]> {
        const holidays = await this.prisma.holiday.findMany();
        return holidays.map(h => ({
            ...h,
            startDate: h.startDate.toISOString(),
            endDate: h.endDate.toISOString(),
        }));
    }

    async findOne(id: string): Promise<HolidayResponse> {
        if (!id) throw new BadRequestException('Holiday ID is required');
        const holiday = await this.prisma.holiday.findUnique({ where: { id } });
        if (!holiday) throw new NotFoundException('Holiday not found');
        return {
            ...holiday,
            startDate: holiday.startDate.toISOString(),
            endDate: holiday.endDate.toISOString(),
        };
    }


    //POST Methods (Used to create new holiday or related resources)
    async create(holiday: CreateHolidayDto): Promise<HolidayResponse> {
        const { name, startDate, endDate, observation } = holiday;
        if (!name || !startDate || !endDate) throw new BadRequestException('Name, start date, and end date are required');

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate)
        startDateObj.setHours(0, 0, 0, 0);
        endDateObj.setHours(23, 59, 59, 999);

        const newHoliday = await this.prisma.holiday.create({
            data: {
                name,
                startDate: startDateObj,
                endDate: endDateObj,
                observation: observation || null,
            },
        });

        return {
            ...newHoliday,
            startDate: newHoliday.startDate.toISOString(),
            endDate: newHoliday.endDate.toISOString(),
        };
    }


    //PUT Methods (Used to update existing holiday or related resources)
    async update(id: string, holiday: Partial<CreateHolidayDto>): Promise<HolidayResponse> {
        if (!id) throw new BadRequestException('Holiday ID is required');
        const existing = await this.prisma.holiday.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Holiday not found');

        let startDateObj = existing.startDate;
        let endDateObj = existing.endDate;

        if (holiday.startDate) {
            startDateObj = new Date(holiday.startDate);
            startDateObj.setHours(0, 0, 0, 0);
        }
        if (holiday.endDate) {
            endDateObj = new Date(holiday.endDate);
            endDateObj.setHours(23, 59, 59, 999);
        }

        const updated = await this.prisma.holiday.update({
            where: { id },
            data: {
                name: holiday.name,
                startDate: startDateObj,
                endDate: endDateObj,
                observation: holiday.observation,
            },
        });

        return {
            ...updated,
            startDate: updated.startDate.toISOString(),
            endDate: updated.endDate.toISOString(),
        };
    }


    //DELETE Methods (Used to delete existing holiday or related resources)
    async remove(id: string): Promise<{ message: string }> {
        if (!id) throw new BadRequestException('Holiday ID is required');

        const existing = await this.prisma.holiday.findUnique({ where: { id } });
        if (!existing) throw new NotFoundException('Holiday not found');
        
        await this.prisma.holiday.delete({ where: { id } });
        return { message: 'Holiday deleted successfully' };
    }

}
