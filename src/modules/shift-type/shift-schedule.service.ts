import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShiftScheduleDto } from './dto/create-shift-schedule.dto';
import { ShiftScheduleResponse } from './types/shift-type-types';

@Injectable()
export class ShiftScheduleService {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateShiftScheduleDto): Promise<ShiftScheduleResponse> {
        return this.prisma.shiftSchedule.create({ data: dto });
    }

    async findAll(): Promise<ShiftScheduleResponse[]> {
        return this.prisma.shiftSchedule.findMany();
    }

    async findOne(id: string): Promise<ShiftScheduleResponse> {
        const schedule = await this.prisma.shiftSchedule.findUnique({ where: { id } });
        if (!schedule) throw new NotFoundException('Shift schedule not found');
        return schedule;
    }

    async update(id: string, dto: Partial<CreateShiftScheduleDto>): Promise<ShiftScheduleResponse> {
        return this.prisma.shiftSchedule.update({ where: { id }, data: dto });
    }

    async remove(id: string): Promise<{ message: string }> {
        await this.prisma.shiftSchedule.delete({ where: { id } });
        return { message: 'Shift schedule deleted successfully' };
    }


}
