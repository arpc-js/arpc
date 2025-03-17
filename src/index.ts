import {Oapi} from "./core/oapi.ts";
import {Auth} from "./core/jwt.ts";

let app=new Oapi()
//app.use(interceptor,auth,cros)//中间件按顺序执行完执行请求
app.run()
/*

function reqlog() {

}
function tracelog(req,ctx) {

}

//验证jwt token和权限中间件，把结果uid，权限存入ctx
function auth(req:Request,ctx) {
    let payload=new Auth('asfdsf').verifyJWT(req.headers['Authorization'])
    //ctx存储uid
}
function interceptor() {

}
function cros() {

}
*/
