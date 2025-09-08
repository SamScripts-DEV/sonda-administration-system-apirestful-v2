export interface Area {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type AreaResponse = Omit<Area, 'createdAt' | 'updatedAt'>;
