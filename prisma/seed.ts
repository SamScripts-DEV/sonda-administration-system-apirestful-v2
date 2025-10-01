import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const areas = [
        { name: 'Técnica', description: 'Gestión Técnica' },
        { name: 'Servicios', description: 'Gestión de Servicios' },
        { name: 'Preventa', description: 'Desarrollo de Negocios' },

    ];

    const permissions = [
        { code: "system.full_access", name: "Acceso total al sistema", description: "Permite todas las acciones en todos los módulos (solo para DEVS)", module: "system", group: "full_access" },

        { code: "user.read", name: "Ver usuarios", description: "Permite ver todos los usuarios", module: "user", group: "read" },
        { code: "user.create", name: "Crear usuarios", description: "Permite crear nuevos usuarios", module: "user", group: "write" },
        { code: "user.update", name: "Editar usuarios", description: "Permite editar usuarios existentes", module: "user", group: "update" },
        { code: "user.delete", name: "Eliminar usuarios", description: "Permite eliminar usuarios", module: "user", group: "delete" },
        { code: "user.activate", name: "Activar usuarios", description: "Permite activar usuarios", module: "user", group: "write" },
        { code: "user.deactivate", name: "Desactivar usuarios", description: "Permite desactivar usuarios", module: "user", group: "write" },
        { code: "user.area.read", name: "Ver usuarios de área", description: "Permite ver los usuarios asignados a un área específica", module: "user", group: "read" },
        { code: "user.area.create", name: "Crear usuarios en área", description: "Permite crear usuarios en su área", module: "user", group: "write" },
        { code: "user.area.update", name: "Editar usuarios de área", description: "Permite editar usuarios de su área", module: "user", group: "update" },
        { code: "user.area.delete", name: "Eliminar usuarios de área", description: "Permite eliminar usuarios de su área", module: "user", group: "delete" },
        { code: "user.roleglobal.assign", name: "Asignar roles globales", description: "Permite asignar roles globales a usuarios", module: "user", group: "write" },
        { code: "user.rolelocal.assign", name: "Asignar roles locales", description: "Permite asignar roles locales a usuarios", module: "user", group: "write" },
        { code: "user.rolelocal.read", name: "Ver roles locales", description: "Permite ver roles locales", module: "user", group: "read" },
        { code: "user.roleglobal.read", name: "Ver roles globales", description: "Permite ver roles globales", module: "user", group: "read" },

        { code: "role.read", name: "Ver roles", description: "Permite ver todos los roles", module: "role", group: "read" },
        { code: "role.create", name: "Crear roles", description: "Permite crear nuevos roles", module: "role", group: "write" },
        { code: "role.update", name: "Editar roles", description: "Permite editar roles existentes", module: "role", group: "update" },
        { code: "role.delete", name: "Eliminar roles", description: "Permite eliminar roles", module: "role", group: "delete" },
        { code: "role.assign.permission", name: "Asignar permisos a roles", description: "Permite asignar permisos a roles", module: "role", group: "write" },

        { code: "permission.read", name: "Ver permisos", description: "Permite ver todos los permisos", module: "permission", group: "read" },
        { code: "permission.create", name: "Crear permisos", description: "Permite crear nuevos permisos", module: "permission", group: "write" },
        { code: "permission.update", name: "Editar permisos", description: "Permite editar permisos existentes", module: "permission", group: "update" },
        { code: "permission.delete", name: "Eliminar permisos", description: "Permite eliminar permisos", module: "permission", group: "delete" },

        { code: "area.read", name: "Ver áreas", description: "Permite ver todas las áreas", module: "area", group: "read" },
        { code: "area.create", name: "Crear áreas", description: "Permite crear nuevas áreas", module: "area", group: "write" },
        { code: "area.update", name: "Editar áreas", description: "Permite editar áreas existentes", module: "area", group: "update" },
        { code: "area.delete", name: "Eliminar áreas", description: "Permite eliminar áreas", module: "area", group: "delete" },
        { code: "area.assign.user", name: "Asignar usuarios a áreas", description: "Permite asignar usuarios a áreas", module: "area", group: "write" },

        { code: "position.read", name: "Ver posiciones", description: "Permite ver todas las posiciones", module: "position", group: "read" },
        { code: "position.create", name: "Crear posiciones", description: "Permite crear nuevas posiciones", module: "position", group: "write" },
        { code: "position.update", name: "Editar posiciones", description: "Permite editar posiciones existentes", module: "position", group: "update" },
        { code: "position.delete", name: "Eliminar posiciones", description: "Permite eliminar posiciones", module: "position", group: "delete" },

        { code: "department.read", name: "Ver departamentos", description: "Permite ver todos los departamentos", module: "department", group: "read" },
        { code: "department.create", name: "Crear departamentos", description: "Permite crear nuevos departamentos", module: "department", group: "write" },
        { code: "department.update", name: "Editar departamentos", description: "Permite editar departamentos existentes", module: "department", group: "update" },
        { code: "department.delete", name: "Eliminar departamentos", description: "Permite eliminar departamentos", module: "department", group: "delete" },

        { code: "ticket.read", name: "Ver tickets", description: "Permite ver todos los tickets", module: "ticket", group: "read" },
        { code: "ticket.create", name: "Crear tickets", description: "Permite crear nuevos tickets", module: "ticket", group: "write" },
        { code: "ticket.update", name: "Editar tickets", description: "Permite editar tickets existentes", module: "ticket", group: "update" },
        { code: "ticket.delete", name: "Eliminar tickets", description: "Permite eliminar tickets", module: "ticket", group: "delete" },
        { code: "ticket.assign.technical", name: "Asignar tickets a técnicos", description: "Permite asignar tickets a especialistas técnicos", module: "ticket", group: "write" },
        { code: "ticket.assign.boc", name: "Asignar tickets a BOC", description: "Permite asignar tickets a miembros de BOC", module: "ticket", group: "write" },

        { code: "vacation.request", name: "Solicitar vacaciones", description: "Permite solicitar vacaciones", module: "vacation", group: "write" },
        { code: "vacation.approve", name: "Aprobar vacaciones", description: "Permite aprobar solicitudes de vacaciones", module: "vacation", group: "write" },
        { code: "vacation.reject", name: "Rechazar vacaciones", description: "Permite rechazar solicitudes de vacaciones", module: "vacation", group: "write" },
        { code: "vacation.read", name: "Ver vacaciones", description: "Permite ver solicitudes de vacaciones", module: "vacation", group: "read" },
        { code: "vacation.update", name: "Editar vacaciones", description: "Permite editar solicitudes de vacaciones", module: "vacation", group: "update" },
        { code: "vacation.delete", name: "Eliminar vacaciones", description: "Permite eliminar solicitudes de vacaciones", module: "vacation", group: "delete" },

        { code: "holiday.read", name: "Ver feriados", description: "Permite ver todos los feriados", module: "holiday", group: "read" },
        { code: "holiday.create", name: "Crear feriados", description: "Permite crear nuevos feriados", module: "holiday", group: "write" },
        { code: "holiday.update", name: "Editar feriados", description: "Permite editar feriados existentes", module: "holiday", group: "update" },
        { code: "holiday.delete", name: "Eliminar feriados", description: "Permite eliminar feriados", module: "holiday", group: "delete" },

        { code: "token.read", name: "Ver tokens", description: "Permite ver todos los tokens", module: "token", group: "read" },
        { code: "token.create", name: "Crear tokens", description: "Permite crear nuevos tokens", module: "token", group: "write" },
        { code: "token.update", name: "Editar tokens", description: "Permite editar tokens existentes", module: "token", group: "update" },
        { code: "token.delete", name: "Eliminar tokens", description: "Permite eliminar tokens", module: "token", group: "delete" },
    ];

    const roles = [
        {
            name: "DEVS",
            description: "Desarrolladores",
            scope: "GLOBAL"
        }

    ]

    for (const area of areas) {
        await prisma.area.upsert({
            where: { name: area.name },
            update: {},
            create: area,
        });
        console.log(`Área procesada: ${area.name}`);
    }

    for (const permission of permissions) {
        await prisma.permission.upsert({
            where: { code: permission.code },
            update: { group: permission.group},
            create: permission
        });
        console.log(`Permiso procesado: ${permission.code}`);
    }

    for (const role of roles) {
        await prisma.role.upsert({
            where: {name: role.name},
            update: {},
            create: role
        })
    }
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());