import {auth, cors, Arpc, onError} from "./core/Arpc.ts";
export let secret='secret'//jwt私钥
const arpc = Arpc({
    rpcDir:'src/arpc',//rpc包扫描路径
    dsn:'mysql://root:root@127.0.0.1:3306/orpc'//有dsn会启动数据库功能
});
arpc.use(onError)//全局异常中间件
arpc.use(cors({origin: '*'}))//跨域中间件
arpc.use(auth(secret,['/user/login']))//jwt登录鉴权中间件，白名单
arpc.listen(80);

