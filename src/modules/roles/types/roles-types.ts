export interface Role {
    id: string;
    name: string;
    description?: string | null;
    scope: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoleResponseWithRelations extends Role {
     areaIds?: string[];
     users?: AssignableUser[];
     permissions: { id: string; name: string }[];
}

export type RoleResponse = Omit<Role, 'createdAt' | 'updatedAt'>;


export interface AssignableUser {
    userId: string;
    firstName: string;
    lastName: string;
    areas: { areaId: string; areaName: string; }[];
}

export interface AssignableUsersByArea {
    areaId: string;
    areaName: string;
    users: AssignableUser[];
}