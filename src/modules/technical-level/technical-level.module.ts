import { Module } from '@nestjs/common';
import { TechnicalLevelService } from './technical-level.service';
import { TechnicalLevelController } from './technical-level.controller';

@Module({
  providers: [TechnicalLevelService],
  controllers: [TechnicalLevelController]
})
export class TechnicalLevelModule {}
