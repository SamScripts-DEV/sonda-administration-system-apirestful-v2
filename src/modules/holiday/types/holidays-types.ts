export interface Holiday {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    observation?: string | null;
    createdAt: string;
    updatedAt: string;
}

export type HolidayResponse = Omit<Holiday, 'createdAt' | 'updatedAt'>;