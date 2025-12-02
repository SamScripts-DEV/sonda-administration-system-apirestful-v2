import { GroupType } from "../dto/create-organizational-groups.dto";

export interface OrganizationalGroupResponse {
    id: string;
    name: string;
    description?: string;
    areaId?: string;
    areaName?: string;
    parentId?: string;
    parentName?: string;
    containerGroupId?: string;
    containerGroupName?: string;
    hierarchyLevel: number;
    groupType?: GroupType;
    createdAt: string;
    updatedAt: string;
    membersCount?: number;
    children?: OrganizationalGroupResponse[];
    members?: GroupMemberResponse[];
    containedGroups?: OrganizationalGroupResponse[];
}

export interface GroupMemberResponse {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userPosition?: string;
    userImageUrl?: string;
    createdAt: string;
}

export interface OrganizationalGroupHierarchy {
    id: string;
    name: string;
    description?: string;
    hierarchyLevel: number;
    areaName?: string;
    children: OrganizationalGroupHierarchy[];
    members: GroupMemberResponse[];
}

export interface OrgChartNode {
    key: string;
    name: string;
    type: 'GROUP' | 'PERSON';
    hierarchyLevel?: number;
    parent?: string;
    group?: string;
    container?: string;
    isGroup: boolean;

    groupType?: GroupType;
    areaName?: string;
    membersCount?: number;

    position?: string;
    imageUrl?: string;
    email?: string;

}

export interface AssignableUserResponse {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    position?: string;
    department?: string;
    area?: string;
    imageUrl?: string;
}


//Data to LDAP

export interface HierarchyChainItem {
    name: string;
    level: number;
    type: 'CONTAINER' | 'LEADERSHIP' | 'OPERATIONAL';
}

export interface LdapOrgGroupAssignmentPayload {
   
    group_name: string;
    group_type: 'CONTAINER' | 'LEADERSHIP' | 'OPERATIONAL';
    hierarchy_level: number;
    area?: string;
    
   
    container_group?: string;
    
 
    hierarchy_chain: HierarchyChainItem[];
    
   
    users: string[];  
}

export interface LdapOrgGroupRemovalPayload {
    group_name: string;
    group_type: 'CONTAINER' | 'LEADERSHIP' | 'OPERATIONAL';
    area?: string;
    users: string[]; 
}

export interface LdapResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface LdapOrgGroupUpdatePayload {
    old_group_name: string;          
    old_hierarchy_level: number;      
    new_group_name: string;          
    new_hierarchy_level: number;      
    new_hierarchy_chain: HierarchyChainItem[];  
}