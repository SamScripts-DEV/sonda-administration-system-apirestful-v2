export interface Department {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type DepartmentResponse = Omit<Department, 'createdAt' | 'updatedAt'>;
