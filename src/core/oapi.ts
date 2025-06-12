import {Auth} from "./jwt.ts";
let asyncLocalStorage = new (require('async_hooks').AsyncLocalStorage)()

function ctx(k: 'req' | 'session' | 'uid'=null): Request | any {
    if (k==null){
        return asyncLocalStorage.getStore()
    }
    if (k == 'req') {
        return asyncLocalStorage.getStore()[k] as Request
    }
    return asyncLocalStorage.getStore()[k]
}

let olog = {
    info: (msg) => {
        console.log({
            rid: asyncLocalStorage.getStore()['rid'],
            level: 'info',
            time: new Date(),
            msg: msg
        })
    },
    err: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level: 'error',
            time: new Date(),
            msg: msg
        })
    },
    debug: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level: 'debug',
            time: new Date(),
            msg: msg
        })
    },
    warn: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level: 'warn',
            time: new Date(),
            msg: msg
        })
    },
    fatal: (msg) => {
        console.error({
            rid: asyncLocalStorage.getStore()['rid'],
            level: 'fatal',
            time: new Date(),
            msg: msg
        })
    },
}
//oapi.route({})
//oapi.post、get
//oapi.intercepter
//opai.cros(配置)
//opai.jwt()//开启jwt和接口权限
let server = null

export class Oapi {
    plugin: any[] = []
    afterplugin:any[] = []
    key:string
    cert:string
    tls(key:string,cert:string){
        this.key=key
        this.cert=cert
        return this
    }
    before(...pligins) {
        this.plugin.push(...pligins)
        return this
    }
    after(...pligins) {
        this.afterplugin.push(...pligins)
        return this
    }
    async run(port:number) {
        let classMap = {}
        let oapi=this
        async function getObj(clazz: string, json: any) {
            //@ts-ignore
            if (!classMap[clazz]) {
                //@ts-ignore
                classMap[clazz] = Object.values(await import(`../api/${clazz}`))[0]
            }
            //@ts-ignore
            let obj = new classMap[clazz]
            return Object.assign(obj, json)
        }

        server = Bun.serve({
            port: port,
            async fetch(req, server) {
                try {
                    let useCtx={}
                    for (const x of oapi.plugin) {
                        let res=await x(req,useCtx)
                        if (res instanceof Response){
                            return res
                        }
                    }
                    const path = new URL(req.url).pathname;
                    if (path === "/ws") {
                        let auth = new Auth('asfdsf')
                        let payload = await auth.verifyJWT(req.headers.get('Authorization'))
                        if (server.upgrade(req, {data: {uid: payload['uid']}})) {
                            return; // do not return a Response
                        }
                    }

                    if (req.method != 'POST') {//仅支持post json，非post请写在routes
                        return new Response('Not POST', {status: 500,})
                    }
                    console.log(`....${path}....`)
                    const contentType = req.headers.get("content-type")
                    let json = {attr: null, args: null}
                    let arg = null
                    if (contentType?.includes("application/json")) {
                        json = await req.json()
                    } else if (contentType?.includes("multipart/form-data")) {
                        arg = await req.formData()
                    } else if (contentType?.includes("text/plain")) {
                        arg = await req.text()
                    } else if (contentType?.includes("application/octet-stream")) {
                        //二进制
                        arg = await req.arrayBuffer()
                    } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
                        arg = await req.text()
                    }
                    const [_, clazz, fn] = path.split('/')
                    let obj = await getObj(clazz, json.attr)//大小写都可以,json.atrr
                    //@ts-ignore
                    let rsp: Response = null
                    let rs = null
                    await asyncLocalStorage.run({...useCtx, req: req}, async () => {
                        if (arg) {
                            rs = await obj[fn](arg)
                        } else {
                            rs = await obj[fn](...json?.args)
                        }
                    })
                    if (typeof rs == 'string') {
                        if (rs.includes(`<xml>`)) {
                            rsp = new Response(rs)
                            rsp.headers.set('Content-Type', 'application/xml')
                        }else if (rs.startsWith('http://')||rs.startsWith('https://')){
                            rsp = new Response(rs,{status:302})
                            rsp.headers.set('Location', rs);
                        }
                    }else if (rs instanceof Response) {
                        rsp = rs
                    }else if (typeof rs == 'object') {
                        rsp = Response.json(rs)
                    }
                    for (const x of oapi.afterplugin) {
                        await x(rsp)
                    }
                    return rsp;//成功返回云函数结果，失败抛出异常,json.args
                } catch (e) {
                    console.log('err:', e.message || e)
                    console.log('err:', e)
                    return new Response(e.message || e, {status: 500});
                }
                return Response.json('eee')
            },
            // tls: {
            //     key: Bun.file(oapi.key),
            //     cert: Bun.file(oapi.cert),
            // },
            websocket: {
                open(ws: any) {
                    const msg = `用户${ws.data.uid}你好,欢迎使用妲己直聊`;
                    console.log(msg)
                    ws.subscribe(`${ws.data.uid}`);
                    ws.send(JSON.stringify({msg: msg,icon:'https://chenmeijia.top/static/logo.png'}))
                },
                message(ws: any, message) {
                    console.log(message)
                    //优化消息，from，to，fn，args，动态调用user.send({from，to，msg})
                    //from，to都是内存数据传入函数
                    //from,to,fn,return      ,to的转发消息框架自动完成
                    //炸金花内存，4人进入房间，订阅房间id，扎金花class，create，join room
                    // 开局4人随机三张，uid:3张牌，底注房间号:{tokens:30，users}，jinhua.start(owner_id)内存加底注，自动发牌
                    //叫牌，跟牌是减少自己token，增加房间token，弃牌移除玩家，jinhua.call,jinhua.follow,discard
                    // 2人开牌，输了移除该玩家，移除到只剩1人结束游戏   publish(rooid,jinhua.vs(me,op)):删除输的，返回谁输,
                    if (typeof message === "string") {
                        let m = JSON.parse(message)
                        if (m?.tp == 'ping') {
                            console.log(`${ws.data.uid}:ping`)
                            return
                        }
                        m['ty'] = typeof message
                        let rsp = server.publish(m.to, JSON.stringify(m));
                        console.log('send:', rsp)
                    }
                },
                close(ws: any) {
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

export {ctx, olog, server}
