import {Auth} from "./src/core/jwt.ts";

let token=`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjEsInBlcm1pc3Npb25zIjpbIioiXX0=.aGznLc6k42PbC6/1bVGoqHZJMwvxcATJlTxNnsuQ9m8=`
console.log(new Auth('asfdsf').verifyJWT(token))
