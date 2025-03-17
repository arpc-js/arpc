import {initBase} from "./Base.ts";
import {Auth} from "./jwt.ts";

let asyncLocalStorage = new (require('async_hooks').AsyncLocalStorage)()

function ctx(k: 'req' | 'session' | 'userId'): Request | any {
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
    run(){
        initBase()
        let classMap = {}
        async function getObj(clazz: string, json: any) {
            //@ts-ignore
            if (!classMap[clazz]) {
                //@ts-ignore
                classMap[clazz] = Object.values(await import(`../api/${clazz}`))[0]
            }
            //@ts-ignore
            return new classMap[clazz]
        }

        const server =Bun.serve({
            //routes: routeMap,
            async fetch(req,server) {
                try {
                    const path = new URL(req.url).pathname;
                    if (path === "/ws") {
                        let auth=new Auth('asfdsf')
                        let payload=await auth.verifyJWT(req.headers.get('Authorization'))
                        if (server.upgrade(req,{data:{uid:payload['uid']}})) {
                            return; // do not return a Response
                        }
                    }
                    if (req.method != 'POST') {//仅支持post json，非post请写在routes
                        return new Response('Not POST', {status: 500,})
                    }
                    let json = await req.json()
                    const [_, clazz, fn] = path.split('/')
                    let obj = await getObj(clazz, {})//大小写都可以,json.atrr
                    let whiteList=['/User/login']
                    let payload
                    if (!whiteList.includes(path)){
                        let auth=new Auth('asfdsf')
                         payload=await auth.verifyJWT(req.headers.get('Authorization')).catch(e=>{throw '403'})
                    }
                    //@ts-ignore
                    let rsp = null
                    await asyncLocalStorage.run({rid: Date.now(),uid:payload, req: req}, async () => {
                        rsp = Response.json(await obj[fn](...json.args))
                    })
                    rsp.headers.set('Access-Control-Allow-Origin', '*');
                    rsp.headers.set('Access-Control-Allow-Methods', '*');
                    rsp.headers.set('Access-Control-Allow-Headers', '*');
                    return rsp;//成功返回云函数结果，失败抛出异常,json.args
                } catch (e) {
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
            websocket: {
                open(ws) {
                    const msg = `${ws.data.uid} has been received`;
                    console.log(msg)
                    ws.subscribe(`${ws.data.uid}`);
                    ws.send(msg)
                },
                message(ws, message) {
                    console.log(message)
                    let m=JSON.parse(message)
                    m['from']=ws.data.uid
                    // this is a group chat
                    // so the server re-broadcasts incoming message to everyone
                    server.publish(m.to, m);
                },
                close(ws) {
                    const msg = `${ws.data.username} has left the chat`;
                    ws.unsubscribe("the-group-chat");
                    server.publish("the-group-chat", msg);
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
