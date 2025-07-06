import { ctx } from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase} from "../core/PgBase.ts";
import  {User} from "./User.ts";
import type {Role} from "./Role.ts";
export class Permission extends PgBase{
    name: string
    roles:Role[]
}
