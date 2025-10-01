export interface Area {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface AreaUserShort {
    id: string;
    firstName: string;
    lastName: string;
}

export interface AreaLocalRole {
    id: string;
    name: string;
}

export interface AreaWithUsersResponse extends AreaResponse {
    users: AreaUserShort[];
    roles: AreaLocalRole[];
}

export type AreaResponse = Omit<Area, 'createdAt' | 'updatedAt'>;
