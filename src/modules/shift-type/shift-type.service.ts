import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto';
import { ShiftTypeResponse } from './types/shift-type-types';


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


}
