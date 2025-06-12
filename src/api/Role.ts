import {OdbBase} from "../core/OdbBase.ts";
import type {Permission} from "./Permission.ts";
import type {User} from "./User.ts";
export class Role extends OdbBase<Role>{
    id:bigint
    name:string
    users:User[]
    permissions:Permission[]
}
