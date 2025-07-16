import {ctx} from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase, prop} from "../core/PgBase.ts";
import {Role} from "./Role.ts";
import {Menu} from "./Menu.ts";
import type {Profile} from "./Profile.ts";
const err = (msg: string) => (e: any) => {
    throw new Error(msg);
};
export class User extends PgBase {
    @prop({ tag: '名称',filter: true,required: true, rules: [{ min: 2, message: '至少2个字' }]})
    name: string
    @prop({ tag: '密码',filter: true})
    pwd: string
    @prop({ tag: '密码',sel: ['北京','上海','深圳'],hide:['update']})
    city: string
    @prop({ tag: '菜单',filter: true})
    menus: Menu[]
    @prop({ tag: '简历',filter: true})
    profile: Profile
    @prop({ tag: '角色',filter: true})
    roles: Role[]
    async login(code) {
        let user=await User.sel('**').get`id>${1}`
        //ctx.info(`sql:`,await super.query`select * from "user" where id>${1}`);
        ctx.info(`User.add called with a=${this.name}, b=${this.pwd}`);
        ctx.info('Request URL:', ctx.req?.url);
        let [u] = await super.get().catch(err('用户名或密码错误'));
        const token = jwt.sign({uid: u.id}, 'secret', {expiresIn: '2h'});
        return {token};
    }
    async add2({a, b}: { a: number; b: number }) {
        ctx.info(`User.add called with a=${a}, b=${b}`);
        ctx.info('Request URL:', ctx.req?.url);
        const token = jwt.sign({uid: 1}, 'secret', {expiresIn: '2h'});
        return {sum: a + b};
    }
    async get111(id) {
        return await Role.sel('id', 'name').get(id)
    }


}
