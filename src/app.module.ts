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

@Module({
  imports: [UsersModule, AreasModule, DepartmentsModule, PositionsModule, RolesModule, PermissionsModule, TokensModule, PrismaModule, HolidayModule, VacationsModule, AuthModule, SalaryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

