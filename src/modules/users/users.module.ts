import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { UserLdapSyncService } from './user-ldap-sync.service';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [UsersController],
  providers: [UsersService, UserLdapSyncService],
  exports: [UserLdapSyncService, UsersService],
})
export class UsersModule {}
