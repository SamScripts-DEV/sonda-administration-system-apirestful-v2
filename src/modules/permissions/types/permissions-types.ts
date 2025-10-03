export interface Permission {
    id: string;
    code: string;
    name?: string | null;
    module?: string | null;
    priority?: number | null;
    group?: string | null;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type PermissionResponse = Omit<Permission, 'createdAt' | 'updatedAt' | 'code'>;