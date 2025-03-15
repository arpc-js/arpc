import {ctx, log} from "../core/oapi.ts";
export class Order{
    id
    name
    total
    status
    created_at
    updated_at
    async add1(id,name){
        let name1='zs'
        log.info(`用户名错误:${name1}`)
        return 'user后端返回值:你好'+ctx("rid")
    }
    async login(code){
        let name1='zs'
        log.info(`用户名错误:${name1}`)
        return 'user后端返回值:你好'+ctx("rid")
    }
}
