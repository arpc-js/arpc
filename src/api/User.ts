import {Base} from "../core/Base.ts";
import {Auth} from "../core/jwt.ts";
import {ctx} from "../core/oapi.ts";
export class User extends Base<User>{
    id:bigint
    openid:string
    name:string
    type:bigint
    info
    pwd:string
    phone:string;
    age:bigint;
    avatar:string;
    created_at:Date
    updated_at:Date
    //定义的登陆云函数
    async login(code){
        console.log('ctx:',ctx('uid'))
        //code换成openid
        const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${'wx4fca4bfde91470b0'}&secret=${'c63f864448667f548248ebcd638121ac'}&js_code=${code}&grant_type=authorization_code`;
        let rsp=await fetch(wxUrl)
        let {openid}= await rsp.json()
        console.log(openid)
        //查询用户
        let u=await this.get`openid=${openid}`
        console.log(u)
        //新用户自动注册
        if (!u){
            this.name='test1'
            this.openid=openid
            u=await this.add()
        }
        //生成jwt token
        let token=new Auth('asfdsf').getUserJWT(1)
        return {uid:u.id,token:token}
    }
}
