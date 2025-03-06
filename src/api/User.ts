import {Base} from "../core/Base.ts";
import {ctx, log} from "../core/oapi.ts";

export class User extends Base<User>{
    name;age
    async add1(id,name){
        let name1='zs'
        log.info(`用户名错误:${name1}`)
        return 'user后端返回值:你好'+ctx("rid")
    }
}
