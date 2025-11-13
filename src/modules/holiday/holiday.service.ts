import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HolidayResponse } from './types/holidays-types';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { ExternalHolidayService } from './external-holiday-sync.service';

@Injectable()
export class HolidayService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly externalHolidayService: ExternalHolidayService

    ) { }

    //GET Methods (Used to retrieve data from the server)
    async findAll(year?: number): Promise<HolidayResponse[]> {
        const targetYear = year || new Date().getFullYear();

        const holidays = await this.prisma.holiday.findMany({
            where: {
                startDate: {
                    gte: new Date(`${targetYear}-01-01T00:00:00.000Z`),
                    lte: new Date(`${targetYear}-12-31T23:59:59.999Z`),
                }

            }
        });

        if (holidays.length > 0) {
            return holidays.map(h => ({
                ...h,
                startDate: h.startDate.toISOString(),
                endDate: h.endDate.toISOString(),
            }));
        }

        const holidaysData = await this.externalHolidayService.fetchExternalHolidays(targetYear);
        const dtos = this.externalHolidayService.formatToHolidaysDtos(holidaysData, targetYear);

        const created = await Promise.all(
            dtos.map(dto => this.prisma.holiday.create({ data: dto }))
        );
        
        return created.map(h => ({
            ...h,
            startDate: h.startDate.toISOString(),
            endDate: h.endDate.toISOString(),
        }))
    }

    async getWeebHookFormat(year?: number): Promise<any> {
        const targetYear = year || new Date().getFullYear();
        const holidays = await this.findAll(targetYear);

        const results: any[] = [];

        holidays.forEach(h => {
            const start = new Date(h.startDate);
            const end = new Date(h.endDate);
            for (
                let d = new Date(start);
                d <= end;
                d.setUTCDate(d.getUTCDate() + 1)
            ){
                const dateEcuador = new Date(d.getTime() - (5 * 60 * 60 * 1000))
                const dateStr = dateEcuador.toISOString().substring(0, 10);

                results.push({
                    id: h.id,
                    event: h.name,
                    effectiveDate: dateStr,
                    notes: h.observation || '',
                    
                })
            }
        });

        return results;
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



    //SYNC Methods (Used to sync holidays from external source)
    async existForYear(year: number): Promise<boolean> {
        const count = await this.prisma.holiday.count({
            where: {
                startDate: {
                    gte: new Date(`${year}-01-01T00:00:00.000Z`),
                    lte: new Date(`${year}-12-31T23:59:59.999Z`),
                }
            }
        });
        return count > 0;
    }

    async syncHolidaysIfNotExist(year: number): Promise<{ imported: number; message: string }> {
        const exists = await this.existForYear(year);

        if (exists) {
            return { imported: 0, message: `Holidays for year ${year} already exist.` };
        }

        const holidaysData = await this.externalHolidayService.fetchExternalHolidays(year);
        const dtos = this.externalHolidayService.formatToHolidaysDtos(holidaysData, year);

        for (const dto of dtos) {
            await this.prisma.holiday.create({ data: dto })
        }

        return { imported: dtos.length, message: `Imported ${dtos.length} holidays for year ${year}.` };
    }

}
