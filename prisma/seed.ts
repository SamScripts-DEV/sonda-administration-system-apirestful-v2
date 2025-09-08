import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const areas = [
        { name: 'Técnica', description: 'Gestión Técnica' },
        { name: 'Servicios', description: 'Gestión de Servicios' },
        { name: 'Preventa', description: 'Desarrollo de Negocios' },

    ];

    const permissions = [

        { code: "system.full_access", name: "Acceso total al sistema", description: "Permite todas las acciones en todos los módulos (solo para DEVS)", module: "system" },

        { code: "user.read", name: "Ver usuarios", description: "Permite ver todos los usuarios", module: "user" },
        { code: "user.create", name: "Crear usuarios", description: "Permite crear nuevos usuarios", module: "user" },
        { code: "user.update", name: "Editar usuarios", description: "Permite editar usuarios existentes", module: "user" },
        { code: "user.delete", name: "Eliminar usuarios", description: "Permite eliminar usuarios", module: "user" },
        { code: "user.activate", name: "Activar usuarios", description: "Permite activar usuarios", module: "user" },
        { code: "user.deactivate", name: "Desactivar usuarios", description: "Permite desactivar usuarios", module: "user" },
        { code: "user.area.read", name: "Ver usuarios de área", description: "Permite ver los usuarios asignados a un área específica", module: "user" },
        { code: "user.area.create", name: "Crear usuarios en área", description: "Permite crear usuarios en su área", module: "user" },
        { code: "user.area.update", name: "Editar usuarios de área", description: "Permite editar usuarios de su área", module: "user" },
        { code: "user.area.delete", name: "Eliminar usuarios de área", description: "Permite eliminar usuarios de su área", module: "user" },
        { code: "user.roleglobal.assign", name: "Asignar roles globales", description: "Permite asignar roles globales a usuarios", module: "user" },
        { code: "user.rolelocal.assign", name: "Asignar roles locales", description: "Permite asignar roles locales a usuarios", module: "user" },
        { code: "user.rolelocal.read", name: "Ver roles locales", description: "Permite ver roles locales", module: "user" },
        { code: "user.roleglobal.read", name: "Ver roles globales", description: "Permite ver roles globales", module: "user" },

        { code: "role.read", name: "Ver roles", description: "Permite ver todos los roles", module: "role" },
        { code: "role.create", name: "Crear roles", description: "Permite crear nuevos roles", module: "role" },
        { code: "role.update", name: "Editar roles", description: "Permite editar roles existentes", module: "role" },
        { code: "role.delete", name: "Eliminar roles", description: "Permite eliminar roles", module: "role" },
        { code: "role.assign.permission", name: "Asignar permisos a roles", description: "Permite asignar permisos a roles", module: "role" },

        { code: "permission.read", name: "Ver permisos", description: "Permite ver todos los permisos", module: "permission" },
        { code: "permission.create", name: "Crear permisos", description: "Permite crear nuevos permisos", module: "permission" },
        { code: "permission.update", name: "Editar permisos", description: "Permite editar permisos existentes", module: "permission" },
        { code: "permission.delete", name: "Eliminar permisos", description: "Permite eliminar permisos", module: "permission" },

        { code: "area.read", name: "Ver áreas", description: "Permite ver todas las áreas", module: "area" },
        { code: "area.create", name: "Crear áreas", description: "Permite crear nuevas áreas", module: "area" },
        { code: "area.update", name: "Editar áreas", description: "Permite editar áreas existentes", module: "area" },
        { code: "area.delete", name: "Eliminar áreas", description: "Permite eliminar áreas", module: "area" },
        { code: "area.assign.user", name: "Asignar usuarios a áreas", description: "Permite asignar usuarios a áreas", module: "area" },

        { code: "position.read", name: "Ver posiciones", description: "Permite ver todas las posiciones", module: "position" },
        { code: "position.create", name: "Crear posiciones", description: "Permite crear nuevas posiciones", module: "position" },
        { code: "position.update", name: "Editar posiciones", description: "Permite editar posiciones existentes", module: "position" },
        { code: "position.delete", name: "Eliminar posiciones", description: "Permite eliminar posiciones", module: "position" },

        { code: "department.read", name: "Ver departamentos", description: "Permite ver todos los departamentos", module: "department" },
        { code: "department.create", name: "Crear departamentos", description: "Permite crear nuevos departamentos", module: "department" },
        { code: "department.update", name: "Editar departamentos", description: "Permite editar departamentos existentes", module: "department" },
        { code: "department.delete", name: "Eliminar departamentos", description: "Permite eliminar departamentos", module: "department" },

        { code: "ticket.read", name: "Ver tickets", description: "Permite ver todos los tickets", module: "ticket" },
        { code: "ticket.create", name: "Crear tickets", description: "Permite crear nuevos tickets", module: "ticket" },
        { code: "ticket.update", name: "Editar tickets", description: "Permite editar tickets existentes", module: "ticket" },
        { code: "ticket.delete", name: "Eliminar tickets", description: "Permite eliminar tickets", module: "ticket" },
        { code: "ticket.assign.technical", name: "Asignar tickets a técnicos", description: "Permite asignar tickets a especialistas técnicos", module: "ticket" },
        { code: "ticket.assign.boc", name: "Asignar tickets a BOC", description: "Permite asignar tickets a miembros de BOC", module: "ticket" },

        { code: "vacation.request", name: "Solicitar vacaciones", description: "Permite solicitar vacaciones", module: "vacation" },
        { code: "vacation.approve", name: "Aprobar vacaciones", description: "Permite aprobar solicitudes de vacaciones", module: "vacation" },
        { code: "vacation.reject", name: "Rechazar vacaciones", description: "Permite rechazar solicitudes de vacaciones", module: "vacation" },
        { code: "vacation.read", name: "Ver vacaciones", description: "Permite ver solicitudes de vacaciones", module: "vacation" },
        { code: "vacation.update", name: "Editar vacaciones", description: "Permite editar solicitudes de vacaciones", module: "vacation" },
        { code: "vacation.delete", name: "Eliminar vacaciones", description: "Permite eliminar solicitudes de vacaciones", module: "vacation" },

        { code: "holiday.read", name: "Ver feriados", description: "Permite ver todos los feriados", module: "holiday" },
        { code: "holiday.create", name: "Crear feriados", description: "Permite crear nuevos feriados", module: "holiday" },
        { code: "holiday.update", name: "Editar feriados", description: "Permite editar feriados existentes", module: "holiday" },
        { code: "holiday.delete", name: "Eliminar feriados", description: "Permite eliminar feriados", module: "holiday" },

        { code: "token.read", name: "Ver tokens", description: "Permite ver todos los tokens", module: "token" },
        { code: "token.create", name: "Crear tokens", description: "Permite crear nuevos tokens", module: "token" },
        { code: "token.update", name: "Editar tokens", description: "Permite editar tokens existentes", module: "token" },
        { code: "token.delete", name: "Eliminar tokens", description: "Permite eliminar tokens", module: "token" },

        // { code: "dashboard.view", name: "Ver dashboard", description: "Permite ver el dashboard principal" },
        // { code: "audit.read", name: "Ver auditoría", description: "Permite ver logs y auditoría del sistema" },
        // { code: "settings.manage", name: "Gestionar configuración", description: "Permite gestionar la configuración global del sistema" }
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
            update: {},
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