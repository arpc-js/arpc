import {ARBase, prop} from "../core/ARBase.ts";

import type {Role} from "./Role.ts";

export class Permission extends ARBase {
    @prop({ tag: '名称',filter: true})
    name: string
    @prop({ tag: '菜单',sel:[],filter: true})
    roles: Role[]
}
