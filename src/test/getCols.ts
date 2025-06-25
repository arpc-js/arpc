// ==== BaseModel.ts ====
import {getsql} from "../bun_core/OdbBase.ts";
import sql from "./postgres.ts";

class BaseModel {
    #sel: any[] = [];
    #where: string | null = null;
    #on: string | null = null;

    static sel(...fields: any[]): any {
        const instance = new this();
        instance.#sel = fields.length > 0 ? fields : ['**'];
        return instance;
    }

    wh(where: string) {
        this.#where = where;
        return this;
    }

    on(on: string) {
        this.#on = on;
        return this;
    }

    getSel() {
        return this.#sel;
    }

    getWhere() {
        return this.#where;
    }

    getOn() {
        return this.#on;
    }

    async get(strings, ...values) {
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        let {selectCols,joins}=generateSQL(this,joinTableMap)
        console.log(selectCols)
        console.log(joins)
/*        const where = values.length > 0 ? sql`where ${sql(strings, ...values)}` : sql``;
        //const join = joins.length > 0 ? sql`join ${sql(strings, ...values)}` : sql``;
        // 组合完整 SQL 并执行
        const { rows } = await sql`
            SELECT ${cols(col)}
            FROM "user"
                     left join ${joins(join)}
            WHERE "user".id = ${id}
        `
        return one*/
    }
}

// ==== 实体定义 ====
class Permission extends BaseModel {
    id: bigint;
    code: string;
}
class Menu extends BaseModel {
    id: bigint;
    name: string;
    path: string;
}
class Role extends BaseModel {
    id: bigint;
    name: string;
    permissions: Permission[];
    menus: Menu[];
}
class Order extends BaseModel {
    id: bigint;
    name: string;
}
class User extends BaseModel {
    id: bigint;
    name: string;
    roles: Role[];
    orders: Order[];
}

// ==== 多对多连接表映射 ====
const joinTableMap: Record<string, number> = {
    'role_permission': 1,
    'permission_role': 1,
    'user_role': 1,
    'role_user': 1,
    'role_menu': 1,
    'menu_role': 1,
};

// ==== SQL 生成器 ====
function generateSQL(root: BaseModel, joinTableMap: Record<string, number>) {
    const rootName = root.constructor.name.toLowerCase();
    const selectCols: string[] = [];
    const joins: string[] = [];
    const wheres: string[] = [];
    const joinedTables = new Set<string>();
    joinedTables.add(rootName);

    function walk(model: BaseModel, tableName: string) {
        const sel = model.getSel();

        for (const field of sel || []) {
            if (typeof field === 'string') {
                if (field === '**') {
                    selectCols.push(`${tableName}.*`);
                } else {
                    selectCols.push(`${tableName}.${field} AS ${tableName}_${field}`);
                }
            } else if (field instanceof BaseModel) {
                const childTable = field.constructor.name.toLowerCase();
                const tables = [tableName, childTable].sort();
                const joinTableName = tables.join('_');
                const hasJoinTable = joinTableMap[joinTableName];

                if (hasJoinTable) {
                    if (!joinedTables.has(joinTableName)) {
                        joins.push(`LEFT JOIN ${joinTableName} ON ${tableName}.id = ${joinTableName}.${tableName}_id`);
                        joinedTables.add(joinTableName);
                    }
                    if (!joinedTables.has(childTable)) {
                        const baseJoin = `${joinTableName}.${childTable}_id = ${childTable}.id`;
                        const extra = field.getOn();
                        joins.push(`LEFT JOIN ${childTable} ON ${extra ? baseJoin + ' AND ' + extra : baseJoin}`);
                        joinedTables.add(childTable);
                    }
                } else {
                    if (!joinedTables.has(childTable)) {
                        const baseJoin = `${tableName}.id = ${childTable}.${tableName}_id`;
                        const extra = field.getOn();
                        joins.push(`LEFT JOIN ${childTable} ON ${extra ? baseJoin + ' AND ' + extra : baseJoin}`);
                        joinedTables.add(childTable);
                    }
                }

                walk(field, childTable);
            }
        }

        const where = model.getWhere();
        if (where) wheres.push(`${tableName}.${where}`);
    }
    walk(root, rootName);
    let sql=`SELECT ${selectCols.join(', ')} FROM ${rootName} ${joins.join(' ')}${wheres.length ? ' WHERE ' + wheres.join(' AND ') : ''}`
    return {selectCols,joins,wheres}
}
try {
    const rs =await User
        .sel('id','name',Role.sel('id','name'))
        .get(`id=${1}`);
    console.log(rs);
}catch (e) {
    console.log(e.stack)
}
