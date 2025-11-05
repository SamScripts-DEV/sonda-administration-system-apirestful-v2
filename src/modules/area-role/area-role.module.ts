import { Module } from '@nestjs/common';
import { AreaRoleService } from './area-role.service';
import { AreaRoleController } from './area-role.controller';

@Module({
  providers: [AreaRoleService],
  controllers: [AreaRoleController]
})
export class AreaRoleModule {}
