import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserTechnicalLevelDto } from './dto/create-user-technical-level.dto';
import { UserTechnicalLevelResponse } from './types/user-technical-level-types';

@Injectable()
export class UserTechnicalLevelService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateUserTechnicalLevelDto): Promise<UserTechnicalLevelResponse> {

    await this.prisma.userTechnicalLevel.deleteMany({
      where: { userId: dto.userId }
    });

  
    const entity = await this.prisma.userTechnicalLevel.create({
      data: dto,
      include: { user: true, technicalLevel: true },
    });

    return this.toResponse(entity);
  }

  async findAll(): Promise<UserTechnicalLevelResponse[]> {
    const entities = await this.prisma.userTechnicalLevel.findMany({
      include: { user: true, technicalLevel: true },
    });

    return entities.map(e => this.toResponse(e))
  }

  async findOne(id: string) {
    const entity = await this.prisma.userTechnicalLevel.findUnique({
      where: { id },
      include: { user: true, technicalLevel: true },
    });
    if (!entity) throw new NotFoundException('Relation not found');
    return this.toResponse(entity);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.prisma.userTechnicalLevel.delete({ where: { id } });
    return { message: 'Relation deleted successfully' };
  }



  private toResponse(entity: any): UserTechnicalLevelResponse {
    return {
      id: entity.id,
      userId: entity.userId,
      technicalLevelId: entity.technicalLevelId,
      userName: entity.user?.firstName
        ? `${entity.user.firstName} ${entity.user.lastName}`
        : undefined,
      technicalLevelName: entity.technicalLevel?.name,
    };
  }
}
