import {jwt_auth, cors, Arpc, onError, staticPlugin} from "./core/Arpc.ts";
import {arbase} from "./core/ArBase.ts";
arbase('postgres://postgres:postgres@156.238.240.143:5432/postgres')
export let secret='secret'//jwt私钥
Arpc()
    .use(onError)//全局异常中间件
    .use(staticPlugin('src/static'))//http://localhost/logo.png
    .use(cors())//跨域中间件
    .use(jwt_auth(secret,['/user/login']))//jwt登录鉴权中间件，白名单
    .listen(80)
