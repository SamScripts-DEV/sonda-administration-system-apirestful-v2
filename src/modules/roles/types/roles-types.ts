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
    towerId: string; 
    towerName: string;
}

export interface AssignableUsersByTower {
    towerId: string;
    towerName: string;
    users: AssignableUser[];
}