import {Base, getsql} from "../core/Base.ts";
import {createOrder, parseXml} from "../core/pay.ts";
import {User} from "./User.ts";
import {ctx, olog, server} from "../core/oapi.ts";
export class Order extends Base<Order>{
    id:bigint
    uid:bigint
    staff_id:bigint
    name:string
    total:number
    status:bigint
    prepay_id:string
    out_trade_no:string
    info
    created_at:Date
    updated_at:Date
    async getByStaffId(id){
        olog.info('hi!')
        console.log('ctx',ctx())
        return await this.gets`staff_id=${id}`
    }
    async getByUid(id){
        return await this.gets`uid=${id}`
    }
    async cb(xml){
        let r=await parseXml(xml)
        this.status=1n
        let [rsp]=await this.update`out_trade_no=${r.out_trade_no}`
        let u= new User()
        u=await u.getById(rsp.uid)
        server.publish(rsp.staff_id, JSON.stringify({
            uid:u.id,
            name:u.name,
            icon:u.avatar,
            msg: '师傅你好，我已下单，请你按时过来',
            time:new Date().getTime()
        }));
        server.publish(rsp.staff_id, JSON.stringify({
            uid:u.id,
            name:u.name,
            icon:u.avatar,
            msg: u.location,
            time:new Date().getTime()
        }));
        return '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>';
    }
    async cbRecharge(xml){
        let r=await parseXml(xml)
        console.log('r:',r)
        this.status=1n
        let [o]=await this.update`out_trade_no=${r.out_trade_no}`
        let u= new User()
        let u1=await u.getById(o.uid)
        u.balance=parseFloat(u1.balance)+parseFloat(o.total)
        await u.updateById(u1.id)
        // 返回成功响应
        return '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>';
    }
    async create(cb='cb',giftAmount=0){
        console.log('cb:',cb)
        let u=new User()
        u=await u.getById(ctx('uid'))
        this.created_at=new Date()
        this.status=0n
        this.out_trade_no=new Date().getTime().toString()
        let p=await createOrder({
            name:this.name,
            out_trade_no:this.out_trade_no,
            total:this.total*100,
            openid:u.openid,
            cb:`https://chenmeijia.top/Order/${cb}`
        });
        this.uid=u.id
        this.prepay_id=p['prepay_id']
        this.total=this.total+giftAmount
        console.log(this)
        await this.add()
        return p
    }
}
