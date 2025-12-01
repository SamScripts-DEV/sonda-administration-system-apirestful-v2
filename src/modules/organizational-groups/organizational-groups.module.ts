import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OrganizationalGroupsService } from './organizational-groups.service';
import { OrganizationalGroupsController } from './organizational-groups.controller';
import { OrgGroupLdapSyncService } from './organizational-groups-ldap-sync.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, HttpModule, ConfigModule],
  providers: [OrganizationalGroupsService, OrgGroupLdapSyncService],
  controllers: [OrganizationalGroupsController],
  exports: [OrganizationalGroupsService],
})
export class OrganizationalGroupsModule {}
