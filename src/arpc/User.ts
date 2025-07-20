import {ctx, required} from '../core/Arpc.ts';
import jwt from "jsonwebtoken";
import {ArBase, prop} from "../core/ArBase.ts";
import {Role} from "./Role.ts";
import {Menu} from "./Menu.ts";
import type {Profile} from "./Profile.ts";
import {secret} from "../index.ts";
export class User extends ArBase {
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
    @required('name', 'pwd')//验证参数和
    async login(code) {
        console.log(await Menu.sel('id,name').get`id>${2}`)
        ctx.info(`User.add called with a=${this.name}, b=${this.pwd}`);
        ctx.info('Request URL:', ctx.req?.url);
        //let [u] = await super.get().err('用户名密码错误')
        const token = jwt.sign({uid: 1}, secret, {expiresIn: '2h'});
        return {token,id:1,name:'java程序员'};
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
