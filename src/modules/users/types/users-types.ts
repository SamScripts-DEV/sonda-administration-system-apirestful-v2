export interface FindAllForSelectType {
    id: string;
    fullNames: string;
    imageUrl: string | null;
}

export interface UserRolesDto {
    global: string[];
    local: { area: string; role: string }[];
}


export interface UserRoleDetailed {
    id: string;
    name: string;
}

export interface UserLocalRoleDetailed {
    area: { id: string; name: string };
    role: { id: string; name: string };
}


export interface UserWithRelationsDto {
    id: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    email: string;
    username: string;
    phone: string[];
    active: boolean;
    address: string | null;
    city: string | null;
    country: string | null;
    province?: string;
    roles?: UserRolesDto;
    rolesDetailed?: {
        global: UserRoleDetailed;
        local: UserLocalRoleDetailed[];
    }
    department?: string;
    departmentId?: string;
    areas?: string[];
    areasDetailed?: { id: string; name: string }[];
    position?: string;
    positionId?: string;
    imageUrl: string | null;
    createdAt?: string;
    technicalLevel?: string;
    technicalLevelId?: string;
}


export interface UserLdapSyncPayload {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  email: string;
  username: string;
  password: string;
  phone: string[];
  active: boolean;
  city: string;
  country: string;
  province: string;
  address: string;
  roleGlobal?: string;
  roleLocal?: string;
  department?: string;
  area?: string;
  position?: string;
  imageUrl?: string;
  createdAt?: string; 
}

export interface UserLdapUpdatePayload {
  firstName?: string;
  lastName?: string;
  address?: string;
  department?: string;
  area?: string;
  active?: boolean;
  position?: string;
  phone?: string[];
  imageUrl?: string;
  password?: string;
}

export interface LdapResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface LdapRoleAssignmentPayload {
    role_global?: string;
    role_local?: string;
    area?: string;
    users: string[];
}