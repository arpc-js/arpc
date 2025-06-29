import {User} from "./src/api/User.ts";
import {Role} from "./src/api/Role.ts";
import {Permission} from "./src/api/Permission.ts";
//无法测试，因为ts元数据未加上
console.log(await User.sel('id','name',Role.sel('id','name',Permission.sel('id','name'))).get`id=${3}`)