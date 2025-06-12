import {OdbBase} from "../core/OdbBase.ts";
import {Auth} from "../core/jwt.ts";
import type {Role} from "./Role.ts";
import type {Order} from "./Order.ts";
//1对1，1对多，多对1，引入外键表示谁是1
//2个list代表多对多
//新增，主插入，子是对象，传入id插入子表，是数组：1对多循环插入，多对多，循环插入时再插入关系表
//新增可以是新对象，可以是选择旧id(一般用于多对多)，
//删除，根据外键1对1/多级联删除，多对多不能级联删除
//改:主表修改，子表可以是增删改
//查模仿eql，递归join然后聚合
export class User extends OdbBase<User>{
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
    roles:Role[]
    order:Order[]
    //定义的登陆云函数
    async getByType(tp,name){
        if (name){
           return  await this.gets`type=${tp} and name=${name}`
        }
        return await this.gets`type=${tp}`
    }
    async login(code){
        //code换成openid
        const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${'wx4fca4bfde91470b0'}&secret=${'c63f864448667f548248ebcd638121ac'}&js_code=${code}&grant_type=authorization_code`;
        let rsp=await fetch(wxUrl)
        let {openid}= await rsp.json()
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
        //u.id = Math.floor(Math.random() * 2) + 45;
        //生成jwt token
        let token=new Auth('asfdsf').getUserJWT(u.id)
        return {uid:u.id,token:token}
    }
}
