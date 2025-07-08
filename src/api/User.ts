import {ctx} from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase} from "../core/PgBase.ts";
import {Role} from "./Role.ts";
import {Order} from "./Order.ts";
import {Permission} from "./Permission.ts";  // 改成这里，用Promise版fs
const err = (msg: string) => (e: any) => {
    throw new Error(msg);
};
export class User extends PgBase {
    name: string
    pwd: string
    order: Order[]
    roles: Role[]
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
    async get1(id) {
        console.log('types:', new Role().types)
        return await User.sel('id', 'name', Role.sel('id', 'name')).get(id)
    }

    async getOrder(id) {
        console.log('types:', new Role().types)
        return await User.sel('id', 'name', Order.sel('id', 'name')).get(id)
    }
    async add1(data: any) {
        console.log(User.types)
        console.log(await User.sel('id', 'name', Role.sel('id', 'name')).get(2))
        ctx.info('111111111111111')
        throw new Error('err 1111')
        console.log(data)
        const file = data?.avatar;
        if (!file) {
            return {error: 'No file uploaded in avatar field'};
        }
        const saveDir = path.resolve(process.cwd(), 'uploads');
        await fs.mkdir(saveDir, {recursive: true});  // 这里是Promise版mkdir，无回调
        const filePath = path.join(saveDir, file.filename);
        await fs.writeFile(filePath, file.data);  // Promise版写文件
        return {message: 'File saved successfully', path: filePath};
    }


  async user1(name) {
    return await User.sel("id", "name", Role.sel("name", Permission.sel("id", "name"))).get`id>${1} and name=${name}`
  }

}