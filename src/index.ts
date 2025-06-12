import {Oapi} from "./core/oapi.ts";
import {Auth} from "./core/jwt.ts";


new Oapi()
    .before(staticPlugin,interceptor,olog)
    .after(cors)
    .run(3000)

async function olog(r, ctx) {
    ctx.rid = Date.now()
}
async function interceptor(r, ctx) {
    console.log('interceptor')
}
async function staticPlugin(r: Request) {
    const path = new URL(r.url).pathname;
    const [_, clazz, fn] = path.split('/')
    if (clazz == 'static') {
        return new Response(Bun.file(`src/static/${fn}`))
    } else if (clazz == 'down') {
        return new Response(await Bun.file(`src/static/${fn}`).bytes())
    } else if (clazz == 'up') {
        const formdata = await r.formData();
        const file = formdata.get('file');
        if (!file) throw new Error('Must upload a profile picture.');
        await Bun.write(`src/static/${file['name']}`, file)
        return new Response(`https://chenmeijia.top/static/${file['name']}`)
    }
}
async function auth(r, ctx) {
    console.log('auth')
    let whiteList = ['/User/login', '/Order/cb', '/Order/cbRecharge']
    let payload
    const path = new URL(r.url).pathname;
    if (!whiteList.includes(path)) {
        let auth = new Auth('asfdsf')
        payload = await auth.verifyJWT(r.headers.get('Authorization')).catch(e => {
            throw '403'
        })
        console.log('payload', payload?.uid)
    }
    ctx.uid = payload?.uid
}
async function cors(w) {
    w.headers.set('Access-Control-Allow-Origin', '*');
    w.headers.set('Access-Control-Allow-Methods', '*');
    w.headers.set('Access-Control-Allow-Headers', '*');
}
