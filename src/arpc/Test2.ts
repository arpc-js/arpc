import {ArBase,prop,menu} from "../core/ArBase.ts"
import { Role } from "./Role.ts"
@menu({"name":"","parent":""})        
export class Test2 extends ArBase{
    @prop({"tag":"名称","filter":"true","hide":[]})
    name: string;
    @prop({"tag":"roles"})
    roles: Role[];
}