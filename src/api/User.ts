import {Base} from "../core/Base.ts";
import {ctx, log} from "../core/oapi.ts";
export class User extends Base<User>{
    id=1;openid='11';name='1';type=1;info='1'
    pwd='1';phone='11';age='11';avatar='1';created_at='1'
    updated_at='1'
    async add1(id,name){
        let name1='zs'
        log.info(`用户名错误:${name1}`)
        return 'user后端返回值:你好'+ctx("rid")
    }
}
