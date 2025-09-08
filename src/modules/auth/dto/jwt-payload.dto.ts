export interface JwtPayloadDto {
    sub: string;
    email: string;
    areas: { id: string; name: string }[];
    roles: { id: string; name: string; scope?: string }[];
    // Puedes agregar permisos si lo necesitas
    permissions?: string[];
}