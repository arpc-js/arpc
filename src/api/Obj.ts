import {controllers, ctx} from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase} from "../core/PgBase.ts";
export class Obj extends PgBase{
    name:string
    menu:string
    attr:[]
    async gets() {
        console.log(this.types)
        return Object.keys(controllers).map((x,i)=>{return {id:i+1,name:x}})
    }
    async add() {
        const className = this.name;
        const fileName = `${className}.ts`;
        const filePath = path.resolve('./src/api', fileName); // 可根据你的项目结构调整
        // 构建属性字符串
        const props = this.attr.map(a => `  ${a.name}: ${a.type};`).join('\n');
        // 构建 class 内容
        const content = `export class ${className} {${props}}`
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ 类文件已生成: ${filePath}`);
        return 'OK';
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
