import {User} from "./src/api/User.ts";
import {initBase} from "./src/core/Base.ts";
initBase()
User.migrate()
