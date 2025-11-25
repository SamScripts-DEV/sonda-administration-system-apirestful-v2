import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import * as jwt from 'jsonwebtoken';
import { RoleLdapSyncPayload } from "./types/roles-types";
import { lastValueFrom } from "rxjs";


@Injectable()
export class RoleLdapSyncService {
    private readonly ldapUrl: string
    private readonly jwtSecret: string

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ){
        this.ldapUrl = this.configService.get<string>('LDAP_MICROSERVICE_URL') || 'http://localhost:8000/api/v2/ldap';
        this.jwtSecret = this.configService.get<string>('JWT_SECRET_LDAP') || "default_secret_key";
    }

    private encodePayload(payload: any): string {
        return jwt.sign(payload, this.jwtSecret, {expiresIn: '5m'});
    }

    async syncUpdateRoleInLdap(payload: RoleLdapSyncPayload): Promise<any> {
        const url = `${this.ldapUrl}/update-role`
        const encodedPayload = this.encodePayload(payload);

        try {
            const response = await lastValueFrom(this.httpService.put(url, {token: encodedPayload}))
            return response.data;

        } catch (error) {
            console.error('Error syncing role update to LDAP:', error.response?.data || error.message);
            throw error;
        }
    }
}