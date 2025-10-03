

export type PermissionUtil={
    code: string;
    module: string;
    group?: string | null;
    priority: number | null;
}

export function hasFullAccess(perms: PermissionUtil[]): boolean {
    return perms.some(p => p.code === "system.full_access")
}

export function reducePermissions(perms: PermissionUtil[]): PermissionUtil[] {
    const map = new Map<string, PermissionUtil>();

    for (const perm of perms) {
        if (perm.code === 'system.full_access') continue;
        const key  = `${perm.module}:${perm.group}`;
        const existing = map.get(key)
        const permPriority = perm.priority ?? 99999;
        const existingPriority = existing?.priority ?? 9999;

        if(!existing || permPriority < existingPriority) {
            map.set(key, perm)

        }
    }

    return Array.from(map.values());
}



export function getEffectivePermissions(perms: PermissionUtil[]): PermissionUtil[] {
    if (hasFullAccess(perms)) {
        return [{code: 'system.full_access', module: '*', group: '*', priority: 1}];
    }

    return reducePermissions(perms);
}