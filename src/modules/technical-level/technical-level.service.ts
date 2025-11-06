import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTechnicalLevelDto } from './dto/create-technical-level.dto';

@Injectable()
export class TechnicalLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTechnicalLevelDto) {
    return this.prisma.technicalLevel.create({ data: dto });
  }

  async findAll() {
    return this.prisma.technicalLevel.findMany();
  }

  async findOne(id: string) {
    const level = await this.prisma.technicalLevel.findUnique({ where: { id } });
    if (!level) throw new NotFoundException('Technical level not found');
    return level;
  }

  async update(id: string, dto: Partial<CreateTechnicalLevelDto>) {
    return this.prisma.technicalLevel.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.technicalLevel.delete({ where: { id } });
    return { message: 'Technical level deleted successfully' };
  }
}
