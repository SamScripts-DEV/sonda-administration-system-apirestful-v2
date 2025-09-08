export interface Role {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type RoleResponse = Omit<Role, 'createdAt' | 'updatedAt'>;


export interface AssignableUser {
    userId: string;
    firstName: string;
    lastName: string;
    areaId: string; 
    areaName: string;
}

export interface AssignableUsersByArea {
    areaId: string;
    areaName: string;
    users: AssignableUser[];
}