import { Module } from '@nestjs/common';
import { TowersService } from './towers.service';
import { TowersController } from './towers.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TowersService],
  controllers: [TowersController]
})
export class TowersModule {}
