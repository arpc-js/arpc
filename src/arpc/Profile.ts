import {ArBase, prop} from "../core/ArBase.ts";
import  {User} from "./User.ts";
import type {Role} from "./Role.ts";
//后端代码，无代码
export class Profile extends ArBase {
    @prop({ tag: '简历名称',filter: true})
    name: string
    @prop({ tag: '简历内容',filter: true})
    parent_id: string
    @prop({ tag: '简历日期'})
    path: string
}
