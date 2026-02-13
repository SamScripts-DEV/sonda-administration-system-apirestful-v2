import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShiftRosterDto } from './dto/create-shift-roster.dto';
import { formatShiftRoster, ShiftRosterResponse } from './types/shift-roster-types';
import { UpdateShiftRosterDto } from './dto/update-shift-roster.dto';
import { ShiftTypeResponse } from '../shift-type/types/shift-type-types';

@Injectable()
export class ShiftRosterService {
    constructor(private prisma: PrismaService) {}


    async create(dto: CreateShiftRosterDto): Promise<ShiftRosterResponse> {
        await  this.validateUsersBelongToArea(dto.userIds ?? [], dto.areaId)

        const roster = await this.prisma.shiftRoster.create({
            data: {
                areaId: dto.areaId,
                name: dto.name,
                description: dto.description,
                startDate: new Date(dto.startDate),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                users: {
                    create: (dto.userIds ?? []).map(userId => ({ userId }))
                },
                shiftTypes: {
                    create: dto.shiftTypeIds.map(shiftTypeId => ({ shiftTypeId }))
                }
            },
            include: {
                users: true,
                shiftTypes: true
            }
        });

        return formatShiftRoster(roster);

    }


    async update(id: string, dto: UpdateShiftRosterDto): Promise<ShiftRosterResponse> {
        const roster = await this.prisma.shiftRoster.findUnique({ where: { id } })
        if (!roster) throw new BadRequestException('Roster no encontrado');

        if (dto.userIds) {
            await this.validateUsersBelongToArea(dto.userIds, roster.areaId)
            await this.prisma.shiftRosterUser.deleteMany({ where: { shiftRosterId: id } })
        }

        if (dto.shiftTypeIds) {
            await this.prisma.shiftRosterShiftType.deleteMany({ where: { shiftRosterId: id} })
        }

        const data: any = {
            name: dto.name,
            description: dto.description,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        }
        if (dto.userIds) {
            data.users = { create: dto.userIds.map(userId => ({ userId })) }
        }
        if (dto.shiftTypeIds) {
            data.shiftTypes = { create: dto.shiftTypeIds.map(shiftTypeId => ({ shiftTypeId })) }
        }

        const updated = await this.prisma.shiftRoster.update({
            where: { id },
            data,
            include: {
                users: true,
                shiftTypes: true
            }
        })

        return formatShiftRoster(updated);
    }


    async findAll(): Promise<ShiftRosterResponse[]> {
        const rosters = await this.prisma.shiftRoster.findMany({
            include: { users: true, shiftTypes: true }
        })
        return rosters.map(formatShiftRoster)
    }


    async findOne(id: string): Promise<ShiftRosterResponse> {
        const roster = await this.prisma.shiftRoster.findUnique({
            where: { id },
            include: { users: true, shiftTypes: true }
        })

        if(!roster) throw new NotFoundException('Roster no encontrado');

        return formatShiftRoster(roster);
    }

    async remove(id: string): Promise<{message: string}> {
        const deleted =await this.prisma.shiftRoster.delete({ where: { id } })
        return { message: `Roster ${deleted.name} eliminado correctamente` }
    }






    //Helperss

    private async validateUsersBelongToArea(userIds: string[], areaId: string): Promise<void> {
        if (!userIds || userIds.length === 0) return;

        const validateUsers = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                areas: {some: {areaId} }
            },
            select: { id: true }
        })
        if (validateUsers.length !== userIds.length) {
            throw new BadRequestException("Algunos usuario no pertenecen al área seleccioanda")
        }
    }


}
