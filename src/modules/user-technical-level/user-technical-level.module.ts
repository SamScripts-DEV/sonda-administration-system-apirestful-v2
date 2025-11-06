import { Module } from '@nestjs/common';
import { UserTechnicalLevelService } from './user-technical-level.service';
import { UserTechnicalLevelController } from './user-technical-level.controller';

@Module({
  providers: [UserTechnicalLevelService],
  controllers: [UserTechnicalLevelController]
})
export class UserTechnicalLevelModule {}
