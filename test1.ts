import {User} from "./src/api/User.ts";

let u=new User()
console.log(u)
/*
console.log(await u.add())
*/
console.log(await u.get`id=1`)
