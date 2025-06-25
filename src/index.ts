import {auth, cors, oapi, onError} from "./core/oapi.ts";

const app = oapi();
app.use(onError); // 放最前面
app.use(cors({origin: '*'}));
//白名单，私钥
app.use(auth(['*'], 'j1kdga2ukdad3flawfjkday'));
app.listen(3000);

