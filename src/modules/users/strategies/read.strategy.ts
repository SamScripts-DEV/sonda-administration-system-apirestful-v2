import { UsersService } from "../users.service"

export type UserReadFn = (service: UsersService, user: any) => Promise<any>;
export type UserReadOneFn = (service: UsersService, user: any, userId: string) => Promise<any>;


export const userReadStrategies: Record<string, UserReadFn> = {
    "system.full_access": (service) => service.findAllUsers(),
    "user.read": (service) => service.findAllUsers(),
    "user.area.read": async (service, user) => service.findByAreas(user.areas?.map(a => a.id) || [])

}

export const userReadOneStrategies: Record<string, UserReadOneFn> = {
    "system.full_access": (service, _, userId) => service.findOneById(userId),
    "user.read": (service, _, userId) => service.findOneById(userId),
    "user.area.read": async (service, user, userId) => service.findOneById(userId)
}