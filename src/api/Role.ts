import {PgBase, prop} from "../core/PgBase.ts";
import  {User} from "./User.ts";
import {Menu} from "./Menu.ts";
//后端代码，无代码
export class Role extends PgBase {
    @prop({ tag: '名称',filter: true})
    name: string
    @prop({ tag: '菜单',sel:[],filter: true})
    menus: Menu[]
    @prop({ tag: '用户',filter: true,hide:['add']})
    users: User[]
}
