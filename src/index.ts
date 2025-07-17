import {auth, cors, Arpc, onError} from "./core/arpc.ts";
export let secret='secret'//jwt私钥
const arpc = Arpc({
    rpcDir:'src/arpc',//rpc包扫描路径
    dsn:'postgres://postgres:postgres@156.238.240.143:5432/postgres'//有dsn会启动数据库功能
});
arpc.use(onError)//全局异常中间件
arpc.use(cors({origin: '*'}))//跨域中间件
arpc.use(auth(secret,['/user/login']))//jwt登录鉴权中间件，白名单
arpc.listen(80);

