export interface Role {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type RoleResponse = Omit<Role, 'createdAt' | 'updatedAt'>;