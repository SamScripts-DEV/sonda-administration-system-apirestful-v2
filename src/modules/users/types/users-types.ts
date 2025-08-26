export interface FindAllForSelectType {
    id: string;
    fullNames: string;
    imageUrl: string | null;
}


//Interface for user with relations, and the names, for example, role, department, etc.
export interface UserWithRelationsDto {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    email: string;
    username: string;
    phone: string;
    active: boolean;
    address: string | null;
    city: string | null;
    country: string | null;
    roles?: string[];
    department?: string;
    towers?: string[];
    localRoles?: {tower: string; role: string}[];
    position?: string;
    imageUrl: string | null;
    createdAt?: string;
}