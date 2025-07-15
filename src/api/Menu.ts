import {PgBase,prop,menu} from "../core/PgBase.ts"
@menu({"name":"","parent":""})        
export class Menu extends PgBase{
    @prop({"tag":"名称","filter":true,"hide":[]})
    name: string;
    @prop({"tag":"上级id","filter":true,"hide":[]})
    parent_id: string;
    @prop({"tag":"路径","filter":"","hide":[]})
    path12: string;
    @prop({"tag":"图标","filter":"","hide":[]})
    icon: string;
    @prop({"tag":"排序","filter":"","hide":[]})
    index: string;
    @prop({"tag":"角色","filter":"","hide":["get","add"],"sel":[]})
    roles: string;
}