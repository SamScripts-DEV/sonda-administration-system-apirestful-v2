import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShiftTypeRoleLocalDto } from './dto/create-shift-type-role.dto';
import { ShiftTypeRoleLocalResponse } from '../shift-type/types/shift-type-types';

@Injectable()
export class ShiftTypeRoleLocalService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateShiftTypeRoleLocalDto): Promise<ShiftTypeRoleLocalResponse> {
    const entity = await this.prisma.shiftTypeRoleLocal.create({
      data: dto,
      include: this.includeRelations,
    });
    return this.mapToResponse(entity);
  }

  async findAll(): Promise<ShiftTypeRoleLocalResponse[]> {
    const entities = await this.prisma.shiftTypeRoleLocal.findMany({
      include: this.includeRelations,
    });
    return entities.map(e => this.mapToResponse(e));
  }

  async findOne(id: string): Promise<ShiftTypeRoleLocalResponse> {
    const entity = await this.prisma.shiftTypeRoleLocal.findUnique({
      where: { id },
      include: this.includeRelations,
    });
    if (!entity) throw new NotFoundException('Relation not found');
    return this.mapToResponse(entity);
  }

  async update(id: string, dto: Partial<CreateShiftTypeRoleLocalDto>): Promise<ShiftTypeRoleLocalResponse> {
    const entity = await this.prisma.shiftTypeRoleLocal.update({
      where: { id },
      data: dto,
      include: this.includeRelations,
    });
    return this.mapToResponse(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.prisma.shiftTypeRoleLocal.delete({ where: { id } });
    return { message: 'Relation deleted successfully' };
  }



  private mapToResponse(entity: any): ShiftTypeRoleLocalResponse {
    return {
      id: entity.id,
      shiftTypeId: entity.shiftTypeId,
      areaRoleId: entity.areaRoleId,
      roleName: entity.areaRole?.role.name,
      areaName: entity.areaRole?.area.name,
    }
  }

  private includeRelations = {
    areaRole: {
      include: {
        role: true,
        area: true,
      }
    }
  }
}
