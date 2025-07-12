import {ctx} from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase, prop} from "../core/PgBase.ts";
import {Role} from "./Role.ts";
const err = (msg: string) => (e: any) => {
    throw new Error(msg);
};
export class User extends PgBase {
    @prop({ tag: '权限1', sel: ['上海', '北京'],filter: true,hide:['get', 'add', 'update']})
    name: string
    @prop({ tag: '权限1', sel: ['上海', '北京'],filter: true,hide:['get', 'add', 'update']})
    pwd: string
    async login(code) {
        //console.log(await User.sel('id','name',Role.sel('id','name')).page(1,10).get`id>${3}`)
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
