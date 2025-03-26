import {Auth} from "./jwt.ts";
import {parseXml} from "./pay.ts";
import {Order} from "../api/Order.ts";
import {getsql} from "./Base.ts";
import {User} from "../api/User.ts";
let asyncLocalStorage = new (require('async_hooks').AsyncLocalStorage)()
function ctx(k: 'req' | 'session' | 'uid'): Request | any {
    if (k == 'req') {
        return asyncLocalStorage.getStore()[k] as Request
    }
    return asyncLocalStorage.getStore()[k]
}

let log = {
    info: (msg) => {
        console.log({
            rid: asyncLocalStorage.getStore()['rid'],
            level:'info',
            time:new Date(),
            msg:msg
        })
    },
    err: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level:'error',
            time:new Date(),
            msg:msg
        })
    },
    debug: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level:'debug',
            time:new Date(),
            msg:msg
        })
    },
    warn: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level:'warn',
            time:new Date(),
            msg:msg
        })
    },
    fatal: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level:'fatal',
            time:new Date(),
            msg:msg
        })
    },
}
//oapi.route({})
//oapi.post、get
//oapi.intercepter
//opai.cros(配置)
//opai.jwt()//开启jwt和接口权限
export class Oapi {
    plugin:any[]=[]
    use(...pligins){
        this.plugin.push(...pligins)
    }
    async run() {
        let classMap = {}
        async function getObj(clazz: string, json: any) {
            //@ts-ignore
            if (!classMap[clazz]) {
                //@ts-ignore
                classMap[clazz] = Object.values(await import(`../api/${clazz}`))[0]
            }
            //@ts-ignore
            let obj=new classMap[clazz]
            return Object.assign(obj,json)
        }

        const server = Bun.serve({
            port:443,
            routes: {
                "/static/:id": req => {
                    return new Response( Bun.file(`src/static/${req.params.id}`))
                },
                "/down/:id":async req => {
                    return new Response(await  Bun.file(`src/static/${req.params.id}`).bytes())
                },
                "/up":async req => {
                    const formdata = await req.formData();
                    const file = formdata.get('file');
                    if (!file) throw new Error('Must upload a profile picture.');
                    await Bun.write(`src/static/${file['name']}`, file)
                    return new Response(`https://chenmeijia.top/static/${file['name']}`)
                }
            },
            //routes: routeMap,
            async fetch(req, server) {
                try {
                    const path = new URL(req.url).pathname;
                    if (path === "/ws") {
                        let auth = new Auth('asfdsf')
                        let payload = await auth.verifyJWT(req.headers.get('Authorization'))
                        if (server.upgrade(req, {data: {uid: payload['uid']}})) {
                            return; // do not return a Response
                        }
                    }
                    if (path === "/Order/cb") {
                        let r=await parseXml(await req.text())
                        console.log('cb:-------',r.out_trade_no)
                        let o=new Order()
                        o.status=1n
                        let sql=getsql()
                        await sql`update "Order" set status=1 where out_trade_no=${r.out_trade_no}`
                        //let newObj=await o.update`out_trade_no=${r.out_trade_no}`
                        //console.log('new obj:',newObj)
                        // 返回成功响应
                        return new Response(
                            '<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>',
                            {headers: {'Content-Type': 'application/xml'}}
                        );
                    }
                    if (path === "/Order/cbRecharge") {
                        let r=await parseXml(await req.text())
                        console.log('cbRecharge:-------',r.out_trade_no)
                        let o=new Order()
                        o.status=1n
                        let sql=getsql()
                        let [o1]=await sql`update "Order" set status=1 where out_trade_no=${r.out_trade_no} RETURNING *`

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
                    if (req.method != 'POST') {//仅支持post json，非post请写在routes
                        return new Response('Not POST', {status: 500,})
                    }
                    let json = await req.json()
                    const [_, clazz, fn] = path.split('/')
                    let obj = await getObj(clazz, json.attr)//大小写都可以,json.atrr
                    let whiteList = ['/User/login','/User/cb','/User/cbRecharge']
                    let payload
                    if (!whiteList.includes(path)) {
                        let auth = new Auth('asfdsf')
                        payload = await auth.verifyJWT(req.headers.get('Authorization')).catch(e => {
                            throw '403'
                        })
                        console.log('payload',payload?.uid)
                    }
                    //@ts-ignore
                    let rsp = null
                    await asyncLocalStorage.run({rid: Date.now(), uid: payload?.uid||0, req: req}, async () => {
                        rsp = Response.json(await obj[fn](...json.args))
                    })
                    rsp.headers.set('Access-Control-Allow-Origin', '*');
                    rsp.headers.set('Access-Control-Allow-Methods', '*');
                    rsp.headers.set('Access-Control-Allow-Headers', '*');
                    return rsp;//成功返回云函数结果，失败抛出异常,json.args
                } catch (e) {
                    console.log(e)
                    return new Response(e.message || e, {
                        status: 500, headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': '*',
                            'Access-Control-Allow-Headers': '*'
                        }
                    });
                }
                return Response.json('eee')
            },
            tls: {
                key: Bun.file("src/core/chenmeijia.top.key"),
                cert: Bun.file("src/core/chenmeijia.top.pem"),
            },
            websocket: {
                open(ws) {
                    const msg = `用户${ws.data.uid}你好,欢迎使用技师直聊`;
                    console.log(msg)
                    ws.subscribe(`${ws.data.uid}`);
                    ws.send(JSON.stringify({msg: msg}))
                },
                message(ws, message) {
                    console.log(message)
                    let m = JSON.parse(message)
                    if (m?.tp=='ping'){
                        console.log('ping')
                        return
                    }
                    m['ty']=typeof message
                    let rsp=server.publish(m.to, JSON.stringify(m));
                    console.log('send:',rsp)
                },
                close(ws) {
                    const msg = `${ws.data.uid} has left the chat`;
                    ws.unsubscribe(`${ws.data.uid}`);
                    server.publish(`${ws.data.uid}`, msg);
                },
            },
            error(error) {
                //@ts-ignore
                return new Response(error.message || error, {status: 500,});
            },
        });
    }
}

export {ctx,log}
