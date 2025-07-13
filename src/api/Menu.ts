import {PgBase, prop} from "../core/PgBase.ts";
import  {User} from "./User.ts";
import type {Role} from "./Role.ts";
//后端代码，无代码
export class Menu extends PgBase {
    @prop({ tag: '名称',filter: true})
    name: string
    @prop({ tag: '上级id',filter: true})
    parent_id: bigint
    @prop({ tag: '路径'})
    path: string
    @prop({ tag: '图标'})
    icon: string
    @prop({ tag: '排序'})
    index: string
    @prop({ tag: '角色',sel:[],hide:['get', 'add', 'update']})
    roles: Role[]
}
