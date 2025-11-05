import { Module } from '@nestjs/common';
import { ShiftTypeRoleLocalController } from './shift-type-role-local.controller';
import { ShiftTypeRoleLocalService } from './shift-type-role-local.service';

@Module({
  controllers: [ShiftTypeRoleLocalController],
  providers: [ShiftTypeRoleLocalService]
})
export class ShiftTypeRoleLocalModule {}
