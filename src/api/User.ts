import {Base} from "../core/Base.ts";
import {Auth} from "../core/jwt.ts";
export class User extends Base<User>{
    id:bigint
    openid:string
    name:string
    type:bigint
    balance:number
    location
    info
    pwd:string
    phone:string;
    age:bigint;
    avatar:string;
    created_at:Date
    updated_at:Date
    city:string
    //定义的登陆云函数
    async getByType(tp,name){
        if (name){
           return  await this.gets`type=${tp} and name=${name}`
        }
        return await this.gets`type=${tp}`
    }
    async login(code){
        console.log(this)
        //code换成openid
        const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${'wx4fca4bfde91470b0'}&secret=${'c63f864448667f548248ebcd638121ac'}&js_code=${code}&grant_type=authorization_code`;
        let rsp=await fetch(wxUrl)
        let {openid}= await rsp.json()
        console.log(openid)
        //查询用户
        let u=await this.get`openid=${openid}`
        //新用户自动注册
        if (!u){
            if (!this.name){
                this.name='李白'
                this.avatar='https://chenmeijia.top/static/logo.png'
            }
            this.balance=0
            this.openid=openid
            u=await this.add()
        }
        u.id = Math.floor(Math.random() * 2) + 45;
        //生成jwt token
        let token=new Auth('asfdsf').getUserJWT(u.id)
        return {uid:u.id,token:token}
    }
}
