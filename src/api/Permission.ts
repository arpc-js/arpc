import {OdbBase} from "../core/OdbBase.ts";
import type {Role} from "./Role.ts";

export class Permission extends OdbBase<Permission>{
    id:bigint
    name:string
    roles:Role[]
}
