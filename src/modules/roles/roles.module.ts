import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RoleLdapSyncService } from './role-ldap-sync.service';

@Module({
  imports:[PrismaModule, UsersModule, HttpModule, ConfigModule],
  controllers: [RolesController],
  providers: [RolesService, RoleLdapSyncService],
  exports: [RolesService, RoleLdapSyncService],
})
export class RolesModule {}
