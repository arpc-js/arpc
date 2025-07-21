import {auth, cors, Arpc, onError} from "./core/Arpc.ts";
import {initDB} from "./core/ArBase.ts";
initDB('postgres://postgres:postgres@156.238.240.143:5432/postgres')
export let secret='secret'//jwt私钥
const arpc = Arpc({
    rpc_dir:'src/arpc',//rpc包扫描路径
});
arpc.use(onError)//全局异常中间件
arpc.use(cors({origin: '*'}))//跨域中间件
arpc.use(auth(secret,['/user/login']))//jwt登录鉴权中间件，白名单
arpc.listen(80);

