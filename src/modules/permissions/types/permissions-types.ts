export interface Permission {
    id: string;
    code: string;
    name?: string | null;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type PermissionResponse = Omit<Permission, 'createdAt' | 'updatedAt'>;