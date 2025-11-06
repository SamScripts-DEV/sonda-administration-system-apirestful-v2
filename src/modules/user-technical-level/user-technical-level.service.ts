import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserTechnicalLevelDto } from './dto/create-user-technical-level.dto';

@Injectable()
export class UserTechnicalLevelService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserTechnicalLevelDto) {
    return this.prisma.userTechnicalLevel.create({ data: dto });
  }

  async findAll() {
    return this.prisma.userTechnicalLevel.findMany({
      include: { user: true, technicalLevel: true },
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.userTechnicalLevel.findUnique({
      where: { id },
      include: { user: true, technicalLevel: true },
    });
    if (!record) throw new NotFoundException('Relation not found');
    return record;
  }

  async remove(id: string) {
    await this.prisma.userTechnicalLevel.delete({ where: { id } });
    return { message: 'Relation deleted successfully' };
  }
}
