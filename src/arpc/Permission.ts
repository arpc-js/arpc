import {ArBase,prop,menu} from "../core/ArBase.ts"

@menu({"name":"","parent":""})        
export class Permission extends ArBase{
    @prop({"tag":"名称","filter":true,"hide":[]})
    name1: string;
    @prop({"tag":"菜单","filter":true,"hide":[],"sel":[]})
    roles: string;
}