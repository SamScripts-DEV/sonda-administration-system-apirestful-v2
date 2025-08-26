export interface Tower {
    id: string;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type TowerResponse = Omit<Tower, 'createdAt' | 'updatedAt'>;
