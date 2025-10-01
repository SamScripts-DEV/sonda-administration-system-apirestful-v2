import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { lastValueFrom } from "rxjs";
import * as jwt from 'jsonwebtoken';
import { LdapResponse, LdapRoleAssignmentPayload, UserLdapSyncPayload, UserLdapUpdatePayload, UserWithRelationsDto } from "./types/users-types";

@Injectable()
export class UserLdapSyncService {
    private readonly ldapUrl: string
    private readonly jwtSecret: string
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

    async syncUserToLdap(payload: UserLdapSyncPayload): Promise<any> {
        const url = `${this.ldapUrl}/create-user`
        const encodedPayload = this.encodePayload(payload);

        try {
            const response = await lastValueFrom(this.httpService.post(url, { token: encodedPayload }));
            return response.data;

        } catch (error) {
            console.error('Error syncing user to LDAP:', error.response?.data || error.message);
            throw error;
        }


    }

    async updateUserInLdap(email: string, payload: UserLdapUpdatePayload): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/users/${email}`;
        const encodedPayload = this.encodePayload(payload);
        try {
            const response = await lastValueFrom(this.httpService.patch(url, { token: encodedPayload }));
            return response.data;
        } catch (error) {
            console.error('Error updating user in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }

    async deleteUserInLdap(email: string): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/users/${email}`;
        try {
            const response = await lastValueFrom(this.httpService.delete(url));
            return response.data;
        } catch (error) {
            console.error('Error deleting user in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }

    async reactivateUserInLdap(email: string): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/users/${email}/reactivate`;
        try {
            const response = await lastValueFrom(this.httpService.patch(url));
            return response.data;
        } catch (error) {
            console.error('Error reactivating user in LDAP:', error.response?.data || error.message);
            throw error;
        }
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
    buildLdapUpdatePayload(user: Partial<UserWithRelationsDto>, password?: string): UserLdapUpdatePayload {
        const payload: UserLdapUpdatePayload = {};

        if (user.firstName) payload.firstName = user.firstName;
        if (user.lastName) payload.lastName = user.lastName;
        if (user.address) payload.address = user.address;
        if (user.department) payload.department = user.department;
        if (user.areas && user.areas.length > 0) payload.area = user.areas[0];
        if (user.active !== undefined) payload.active = user.active;
        if (user.position) payload.position = user.position;
        if (user.phone) payload.phone = user.phone;
        if (user.imageUrl) payload.imageUrl = user.imageUrl;
        if (password) payload.password = password;

        return payload;
    }


    async assignRolesToUsersInLdap(payload: LdapRoleAssignmentPayload): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/assign-roles`;
        const encodedPayload = this.encodePayload(payload);

        try {
            const response = await lastValueFrom(this.httpService.post(url, { token: encodedPayload }));
            return response.data;

        } catch (error) {
            console.error('Error assigning roles to users in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }

    async updateRoleUsersInLdap(payload: LdapRoleAssignmentPayload): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/update-role-users`;
        const encodedPayload = this.encodePayload(payload);

        try {
            const response = await lastValueFrom(
                this.httpService.post(url, { token: encodedPayload })
            );
            return response.data;
        } catch (error) {
            console.error('Error updating role users in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }

    async removeUsersFromRolesInLdap(email: string): Promise<LdapResponse> {
        const url = `${this.ldapUrl}/remove-role/${email}`
        try {
            const response = await lastValueFrom(this.httpService.delete(url));
            return response.data;

        } catch (error) {
            console.error('Error removing users from roles in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }


    async deleteRoleGroupInLdap(roleType: string, roleName: string, area?: string): Promise<LdapResponse> {
        let url = `${this.ldapUrl}/delete-role-group?role_type=${roleType}&role_name=${encodeURIComponent(roleName)}`;
        if (roleType === 'role_local' && area) {
            url += `&area=${encodeURIComponent(area)}`;
        }
        try {
            const response = await lastValueFrom(this.httpService.delete(url));
            return response.data;
        } catch (error) {
            console.error('Error deleting role group in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }




    //Helpers
    async removeRoleFromUserInLdap(email: string, roleType: string, roleName: string, area?: string): Promise<void> {
        let url = `${this.ldapUrl}/remove-role/${email}?role_type=${roleType}&role_name=${encodeURIComponent(roleName)}`;
        if (roleType === 'role_local' && area) {
            url += `&area=${encodeURIComponent(area)}`;
        }
        try {
            const response = await lastValueFrom(this.httpService.delete(url));
            return response.data;

        } catch (error) {
            console.error('Error removing role from user in LDAP:', error.response?.data || error.message);
            throw error;
        }
    }
}