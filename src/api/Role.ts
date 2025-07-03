import { ctx } from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase} from "../core/PgBase.ts";
import  {User} from "./User.ts";
import type {Permission} from "./Permission.ts";
function col(meta: Record<string, any> = {}) {
    return function (target: any, key: string) {
        // 存储每个字段的元信息
        if (!target.constructor.cols) {
            target.constructor.cols = {};
        }
        target.constructor.cols[key] = meta;
    };
}
export class Role extends PgBase{
    name: string
    users:User[]
    @col({msel:[]})
    permission:Permission[]
    async add2({ a, b }: { a: number; b: number }) {
        ctx.info(`User.add called with a=${a}, b=${b}`);
        ctx.info('Request URL:', ctx.req?.url);
        const token = jwt.sign({uid: 1}, 'secret', { expiresIn: '2h' });
        return { sum: a + b };
    }

    async get1(id) {
    }
    async add1(data: any) {

        ctx.info('111111111111111')
        throw new Error('err 1111')
        console.log(data)
        const file = data?.avatar;
        if (!file) {
            return { error: 'No file uploaded in avatar field' };
        }
        const saveDir = path.resolve(process.cwd(), 'uploads');
        await fs.mkdir(saveDir, { recursive: true });  // 这里是Promise版mkdir，无回调

        const filePath = path.join(saveDir, file.filename);
        await fs.writeFile(filePath, file.data);  // Promise版写文件

        return { message: 'File saved successfully', path: filePath };
    }
}
