import {ArBase, prop} from "../core/ArBase.ts";

import type {Role} from "./Role.ts";

export class Permission extends ArBase {
    @prop({ tag: '名称',filter: true})
    name: string
    @prop({ tag: '菜单',sel:[],filter: true})
    roles: Role[]
}
