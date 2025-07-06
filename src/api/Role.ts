import { ctx } from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {PgBase} from "../core/PgBase.ts";
import  {User} from "./User.ts";
import type {Permission} from "./Permission.ts";
function col(meta: Record<string, any> = {}) {
    return function (target: any, key: string) {
        // 存储每个字段的元信息
        if (!target.constructor.cols) {
            target.constructor.cols = {};
        }
        target.constructor.cols[key] = meta;
    };
}
//后端代码，无代码
export class Role extends PgBase{
    name: string
    users:User[]
    @col({msel:[]})
    permissions:Permission[]
}
