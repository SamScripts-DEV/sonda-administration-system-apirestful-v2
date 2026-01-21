import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto';
import { ShiftInfo, ShiftTypeResponse } from './types/shift-type-types';


@Injectable()
export class ShiftTypeService {
    constructor(private readonly prisma: PrismaService) { }


    async findAll(): Promise<ShiftTypeResponse[]> {
        return this.prisma.shiftType.findMany({
            include: { schedules: true, roleLocals: true }
        })
    }

    async findOne(id: string): Promise<ShiftTypeResponse> {
        const shiftType = await this.prisma.shiftType.findUnique({
            where: { id },
            include: { schedules: true, roleLocals: true }
        })

        if (!shiftType) throw new Error('Shift type not found')

        return shiftType;
    }

    //Function to get basic Info to endpoint public and be used in microservices
    async findManyBasicinfoByIds(ids: string[]): Promise<ShiftInfo[]> {
        if (!ids || ids.length === 0) return [];

        const shiftTypes = await this.prisma.shiftType.findMany({
            where: {id: { in: ids }},
            select: {
                id: true, 
                name: true, 
                description: true,
                schedules: {select: {id: true, startTime: true, endTime: true}}
            }
        })

        return shiftTypes.map(st => ({
            id: st.id,
            name: st.name,
            description: st.description,
            schedules: st.schedules.map(sch => ({
                id: sch.id,
                startTime: sch.startTime,
                endTime: sch.endTime,
                durationHours: this.calculateDurationHours(sch.startTime, sch.endTime)
            }))
        }))
    }

    async create(dto: CreateShiftTypeDto): Promise<ShiftTypeResponse> {
        return this.prisma.shiftType.create({ data: dto })

    }


    async update(id: string, dto: Partial<CreateShiftTypeDto>): Promise<ShiftTypeResponse> {
        return this.prisma.shiftType.update({
            where: { id },
            data: dto
        })
    }

    async remove(id: string): Promise<{ message: string }> {
        await this.prisma.shiftType.update({
            where: {id},
            data: {isActive: false}
        })

        return { message: 'Shift type deleted successfully' }
    }

    async activate(id: string): Promise<{message: string}> {
        await this.prisma.shiftType.update({
            where: {id},
            data: {isActive: true}
        })

        return { message: 'Shift type activated successfully' }
    }


    //Function to get duration of a shift type

    private calculateDurationHours(start: string, end: string): number{
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let duration = (endH + endM / 60) - (startH + startM / 60 )
        if (duration < 0) duration += 24;
        return Math.round(duration * 100) / 100
    }


}
