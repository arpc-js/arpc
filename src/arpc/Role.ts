import {ArBase,prop,menu} from "../core/ArBase.ts"
import { Test2 } from "./Test2.ts"
@menu({"name":"","parent":""})        
export class Role extends ArBase{
    @prop({"tag":"名称","filter":true,"hide":[]})
    name: string;
    @prop({"tag":"菜单","filter":true,"hide":[],"sel":[]})
    menus: string;
    @prop({"tag":"用户","filter":true,"hide":["add"]})
    users: string;
    @prop({"tag":"用户","filter":true,"hide":["add"]})
    permissions: string;
    @prop({"tag":"test2s"})
    test2s: Test2[];
}