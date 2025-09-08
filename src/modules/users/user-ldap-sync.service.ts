import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
import { UserLdapSyncPayload, UserWithRelationsDto } from "./types/users-types";

@Injectable()
export class UserLdapSyncService {
    constructor(private readonly httpService: HttpService){}

    async syncUserToLdap(payload: UserLdapSyncPayload): Promise<any>{
        const url = 'http://localhost:8000/create-user'
        await lastValueFrom(this.httpService.post(url, payload));

    } 

    buildLdapPayload(user: UserWithRelationsDto, password: string): UserLdapSyncPayload {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        nationalId: user.nationalId,
        email: user.email,
        username: user.username,
        password: password,
        phone: user.phone,
        active: user.active,
        city: user.city ?? '',
        country: user.country ?? '',
        province: user.province ?? '',
        address: user.address ?? '',
        roleGlobal: user.roles?.global?.[0] ?? '',
        roleLocal: user.roles?.local?.[0]?.role ?? '',
        department: user.department ?? '',
        area: user.areas?.[0] ?? '',
        position: user.position ?? '',
        imageUrl: user.imageUrl ?? '',
        createdAt: user.createdAt ?? new Date().toISOString(),
    };
}
}