import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AreasModule } from './modules/areas/areas.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { PositionsModule } from './modules/positions/positions.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { PrismaModule } from './prisma/prisma.module';
import { HolidayModule } from './modules/holiday/holiday.module';
import { VacationsModule } from './modules/vacations/vacations.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { SalaryModule } from './modules/salary/salary.module';
import { ShiftTypeModule } from './modules/shift-type/shift-type.module';
import { ShiftScheduleController } from './modules/shift-type/shift-schedule.controller';
import { ShiftScheduleService } from './modules/shift-type/shift-schedule.service';
import { ShiftAssignmentModule } from './modules/shift-assignment/shift-assignment.module';
import { ShiftHoursService } from './modules/shift-assignment/shift-hours.service';
import { ShiftHoursController } from './modules/shift-assignment/shift-hours.controller';
import { ShiftEventModule } from './modules/shift-event/shift-event.module';
import { ShiftTypeRoleLocalModule } from './modules/shift-type-role-local/shift-type-role-local.module';
import { AreaRoleModule } from './modules/area-role/area-role.module';

@Module({
  imports: [UsersModule, AreasModule, DepartmentsModule, PositionsModule, RolesModule, PermissionsModule, TokensModule, PrismaModule, HolidayModule, VacationsModule, AuthModule, SalaryModule, ShiftTypeModule, ShiftAssignmentModule, ShiftEventModule, ShiftTypeRoleLocalModule, AreaRoleModule],
  controllers: [AppController, ShiftScheduleController, ShiftHoursController],
  providers: [AppService, ShiftScheduleService, ShiftHoursService],
})
export class AppModule {}

