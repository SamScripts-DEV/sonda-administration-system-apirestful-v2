import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import * as jwt from 'jsonwebtoken';
import {
    LdapOrgGroupAssignmentPayload,
    LdapOrgGroupRemovalPayload,
    LdapOrgGroupUpdatePayload,
    LdapResponse
} from "./types/organizational-groups-types";

@Injectable()
export class OrgGroupLdapSyncService {
    private readonly ldapUrl: string;
    private readonly jwtSecret: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService
    ) {
        this.ldapUrl = this.configService.get<string>('LDAP_MICROSERVICE_URL') || 'http://localhost:8000/api/v2/ldap';
        this.jwtSecret = this.configService.get<string>('JWT_SECRET_LDAP') || "default_secret_key";
    }

    private encodePayload(payload: any): string {
        return jwt.sign(payload, this.jwtSecret, { expiresIn: '5m' });
    }

    async assignMembersToOrgGroupInLdap(payload: LdapOrgGroupAssignmentPayload): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/assign-organizational-group`;
        const encodedPayload = this.encodePayload(payload);

        try {
            const response = await lastValueFrom(
                this.httpService.post(url, { token: encodedPayload })
            );
            return response.data;
        } catch (error) {
            console.error('Error assigning members to org group in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }


    async updateOrgGroupInLdap(payload: LdapOrgGroupUpdatePayload): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/update-organizational-group`;
        const encodedPayload = this.encodePayload(payload);

        try {
            const response = await lastValueFrom(
                this.httpService.put(url, {token: encodedPayload})
            );
            return response.data;
        } catch(error) {
            console.error('Error updating org group in LDAP: ', error.response?.data || error.message);
            throw error
        }
    }

    async removeUserFromOrgGroupInLdap(email: string, groupName: string, hierarchyLevel: number): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/remove-user-from-organizational-group/${encodeURIComponent(email)}`;
        const queryParams = `?group_name=${encodeURIComponent(groupName)}&hierarchy_level=${hierarchyLevel}`;

        try {
            const response = await lastValueFrom(
                this.httpService.delete(`${url}${queryParams}`)
            );
            return response.data;
        } catch (error) {
            console.error('Error removing user from org group in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }
}