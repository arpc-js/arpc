import {Base, getsql} from "../core/Base.ts";
import {createOrder, parseXml} from "../core/pay.ts";
import {User} from "./User.ts";
import {ctx} from "../core/oapi.ts";
export class Order extends Base<Order>{
    id:bigint
    uid:bigint
    name:string
    total:number
    status:bigint
    prepay_id:string
    out_trade_no:string
    info
    created_at:Date
    updated_at:Date
    async cb(){
        let req=ctx("req")
        let r=await parseXml(await req.text())
        console.log('cb:-------')
        // 处理订单逻辑
        console.log(`校验成功，req:${r}`);
        this.status=1n
        let o=await this.update`prepay_id='${r.prepay_id}'`
        console.log('new obj:')
        // 返回成功响应
        return new Response(
            '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
            {headers: {'Content-Type': 'application/xml'}}
        );
    }
    async cbRecharge(){
        let req=ctx("req")
        let r=await parseXml(await req.text())
        console.log('cbRecharge:-------',r.out_trade_no)
        let o=new Order()
        o.status=1n
        let sql=getsql()
        let o1=await sql`update "Order" set status=1 where out_trade_no=${r.out_trade_no} RETURNING *`

        let u=new User()
        let u1=await u.getById(o1.uid)
        u.balance=parseFloat(u1.balance)+parseFloat(o1.total)
        await u.updateById(u1.id)
        // 返回成功响应
        return new Response(
            '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
            {headers: {'Content-Type': 'application/xml'}}
        );
    }
    async create(cb='cb'){
        console.log('cb:',cb)
        this.uid=ctx('uid')
        this.created_at=new Date()
        this.status=0n
        this.out_trade_no=new Date().getTime().toString()
        let p=await createOrder({
            name:this.name,
            out_trade_no:this.out_trade_no,
            total:this.total,
            openid:'oUotf7Fjf3ZSJ9x1_0MjsLOd-ib4',
            cb:`http://chenmeijia.top/Order/${cb}`
        });
        this.prepay_id=p['prepay_id']
        await this.add()
        return p
    }
    async recharge(){
        this.created_at=new Date()
        this.status=0n
        await this.add()
        let p=await createOrder({
            name:this.name,
            id:this.id+23,
            total:this.total,
            openid:'oUotf7Fjf3ZSJ9x1_0MjsLOd-ib4',
            cb:''
        });
        let u=new User()
        let u1=await u.getById(ctx('uid'))
        u.balance=u1.balance+this.total
        await u.updateById(u1.id)
        return p
    }
}
