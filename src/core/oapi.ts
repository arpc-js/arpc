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

function run() {
    let routeMap = {
        "/test/test": (req: Request) => {
            return new Response(req.url);
        }
    }
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

    Bun.serve({
        //routes: routeMap,
        async fetch(req) {
            try {
                if (req.method != 'POST') {//仅支持post json，非post请写在routes
                    return new Response('Not POST', {status: 500,})
                }
                const path = new URL(req.url).pathname;
                let json = await req.json()
                const [_, clazz, fn] = path.split('/')
                let obj = await getObj(clazz, {})//大小写都可以,json.atrr
                //@ts-ignore
                let rsp = null
                await asyncLocalStorage.run({rid: Date.now(), req: req}, async () => {
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
        error(error) {
            //@ts-ignore
            return new Response(error.message || error, {status: 500,});
        },
    });
}

export {run, ctx,log}
