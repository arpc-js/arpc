//@ts-ignore
import { Pool } from 'pg'

const sql = new Pool({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    host: '156.238.240.143',
    port: 5432,
})

class BaseModel {
    #sel: any[] = [];
    #where: string | null = null;
    #onStatement: string | null = null;
    #onArgs: any[] = [];

    static sel(...fields: any[]): any {
        const instance = new this();
        instance.#sel = fields.length > 0 ? fields : ['**'];
        return instance;
    }

    wh(where: string) {
        this.#where = where;
        return this;
    }

    /**
     * on 支持标签模板 或字符串，自动给字段加表名前缀
     * @param strings
     * @param values
     * @returns
     */
    on(strings: TemplateStringsArray | string, ...values: any[]) {
        if (typeof strings === 'string') {
            // 纯字符串，尝试简单加表名前缀
            this.#onStatement = addTablePrefix(strings, this.constructor.name.toLowerCase());
            this.#onArgs = [];
        } else {
            // 标签模板，先转换，再加前缀
            const { statement, args } = tagToPrepareStatement(strings, values, 1);
            const withPrefix = addTablePrefix(statement, this.constructor.name.toLowerCase());
            this.#onStatement = withPrefix;
            this.#onArgs = args;
        }
        return this;
    }

    getSel() {
        return this.#sel;
    }

    getWhere() {
        return this.#where;
    }

    getOnStatement() {
        return this.#onStatement;
    }

    getOnArgs() {
        return this.#onArgs;
    }

    async get(strings: TemplateStringsArray, ...values: any[]) {
        const table = this.constructor.name.toLowerCase();
        const { selectCols, joins, args: joinArgs, paramCount } = generateSQL(this, joinTableMap);

        const { statement: whereSql, args: whereArgs } = tagToPrepareStatement(strings, values, paramCount + 1);
        const whereClause = whereSql ? ` WHERE ${whereSql}` : '';

        const text = `SELECT ${selectCols.join(', ')} FROM "${table}" ${joins.join(' ')}${whereClause}`;
        const allArgs = [...joinArgs, ...whereArgs];

        console.log(text);
        console.log(allArgs);

        // const res = await sql.query(text, allArgs);
        // return res.rows;
    }
}

/**
 * 给 on 条件里的字段添加表名前缀
 * 简单做法：对形如 id、name 等独立字段加前缀，忽略已有点的字段
 * 可根据业务调整
 */
function addTablePrefix(sql: string, tableName: string): string {
    // 只给独立单词加前缀，排除已经带点号的字段，避免重复前缀
    return sql.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g, (match) => {
        if (match.includes('.')) return match; // 已带点，跳过
        // 排除SQL关键字或数字，简单示范，仅常用字段处理
        const keywords = ['AND','OR','ON','IN','IS','NULL','NOT','LIKE','BETWEEN','EXISTS'];
        if (keywords.includes(match.toUpperCase())) return match;
        if (/^\d+$/.test(match)) return match; // 数字跳过
        return `${tableName}.${match}`;
    });
}

function generateSQL(root: BaseModel, joinTableMap: Record<string, number>) {
    const rootName = root.constructor.name.toLowerCase();
    const selectCols: string[] = [];
    const joins: string[] = [];
    const joinedTables = new Set<string>();
    const allArgs: any[] = [];
    let paramCounter = 1;

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
                        const extra = field.getOnStatement();
                        const extraArgs = field.getOnArgs();
                        let joinCond = baseJoin;
                        if (extra) {
                            const remapped = remapPlaceholders(extra, paramCounter);
                            joinCond += ' AND ' + remapped.sql;
                            allArgs.push(...extraArgs);
                            paramCounter += extraArgs.length;
                        }
                        joins.push(`LEFT JOIN ${childTable} ON ${joinCond}`);
                        joinedTables.add(childTable);
                    }
                } else {
                    if (!joinedTables.has(childTable)) {
                        const baseJoin = `${tableName}.id = ${childTable}.${tableName}_id`;
                        const extra = field.getOnStatement();
                        const extraArgs = field.getOnArgs();
                        let joinCond = baseJoin;
                        if (extra) {
                            const remapped = remapPlaceholders(extra, paramCounter);
                            joinCond += ' AND ' + remapped.sql;
                            allArgs.push(...extraArgs);
                            paramCounter += extraArgs.length;
                        }
                        joins.push(`LEFT JOIN ${childTable} ON ${joinCond}`);
                        joinedTables.add(childTable);
                    }
                }

                walk(field, childTable);
            }
        }
    }

    walk(root, rootName);

    return { selectCols, joins, args: allArgs, paramCount: paramCounter - 1 };
}

function tagToPrepareStatement(strings: TemplateStringsArray, values: any[], startIndex = 1) {
    let text = '';
    const params: any[] = [];
    let paramIndex = startIndex;

    for (let i = 0; i < strings.length; i++) {
        text += strings[i];
        if (i < values.length) {
            const val = values[i];
            if (val && val.__raw) {
                text += val.text;
            } else {
                text += `$${paramIndex++}`;
                params.push(val);
            }
        }
    }

    return { statement: text, args: params };
}

// 替换 ON 语句中的 $1, $2... 为全局编号
function remapPlaceholders(sql: string, startIndex: number) {
    let i = 1;
    return {
        sql: sql.replace(/\$\d+/g, () => `$${startIndex++}`),
    };
}

// 模型定义
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

// 多对多关系映射表
const joinTableMap: Record<string, number> = {
    'role_permission': 1,
    'permission_role': 1,
    'user_role': 1,
    'role_user': 1,
    'role_menu': 1,
    'menu_role': 1,
};

// 使用示例
(async () => {
    const rs = await User.sel('*').get`id = ${42}`;
    console.log(rs);
})();
