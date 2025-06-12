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
    //支持3星表达式,支持字符串和数组2种格式，字符串的话切分转数组即可
    //支持exclude,通用字符串逗号分割和数组2种方式
    static sel(...fields: any[]): any {
        const instance = new this();
        if (fields[0].includes('*')){
            const mainAttrs = [];              // 主表字段
            const childAttrs = [];         // 一对一对象字段// 分离字段类型
            for (const [k, v] of Object.entries(this)) {
                if (v === null || v === undefined) continue;
                if (k === 'roles'||k === 'permissions') {//子对象
                    childAttrs.push(k)
                } else {
                    mainAttrs.push(k)
                }
            }
            fields=mainAttrs
            if (fields[0]=='**'||fields[0]=='***'){//创建所有子对象Sel
                //所有字
                for (let childAttr of childAttrs) {
                    let obj=null//2星用class.sel('*'),3星用class.sel('**')
                    fields.push(obj)
                }
            }
        }
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
        const { selectCols, joins, args: joinArgs, paramCount } = getSqlParts(this, joinTableMap);
        //顺便返回每张连表，根据user_id,role_id，permission_id聚合json
        const { statement: whereSql, args: whereArgs } = tagToPrepareStatement(strings, values, paramCount + 1);
        const whereClause = whereSql ? ` WHERE ${whereSql}` : '';

        const text = `SELECT ${selectCols.join(', ')} FROM "${table}" ${joins.join(' ')}${whereClause}`;
        const allArgs = [...joinArgs, ...whereArgs];

        console.log(text);
        console.log(allArgs);

        const {rows} = await sql.query(text, allArgs);
        //默认permission_id聚合成permissions，可以根据Role类里面的名称
        console.log(rows)
        //
        const grouped = dynamicGroup(rows, ['user_id','role_id','permission_id'],['roles','permissions']);
        return grouped;
    }

    mapRowsToJson(rows) {
        const rootName = this.constructor.name.toLowerCase();
        const childrenFields = this.#sel.filter(f => f instanceof BaseModel);
        const mainFields = this.#sel.filter(f => typeof f === 'string' && f !== '**');

        // 用 Map 根据主键聚合
        const map = new Map();

        for (const row of rows) {
            // 主表ID作为聚合key
            const rootId = row[`${rootName}_id`];
            if (!rootId) continue;

            let rootObj = map.get(rootId);
            if (!rootObj) {
                rootObj = {};
                // 填充主表字段
                for (const f of mainFields) {
                    rootObj[f] = row[`${rootName}_${f}`];
                }
                // 初始化子对象数组
                for (const childField of childrenFields) {
                    rootObj[childField.constructor.name.toLowerCase() + 's'] = [];
                }
                map.set(rootId, rootObj);
            }

            // 处理子对象
            for (const childField of childrenFields) {
                const childName = childField.constructor.name.toLowerCase();
                const childIdKey = `${childName}_id`;

                const childId = row[childIdKey];
                if (!childId) continue;

                // 检查是否已存在，避免重复添加
                const childList = rootObj[childName + 's'];
                if (!childList.find(c => c.id === childId)) {
                    // 简单示例：只取id和name字段
                    const childObj = {};
                    for (const f of childField.getSel()) {
                        if (typeof f === 'string' && f !== '**') {
                            childObj[f] = row[`${childName}_${f}`];
                        }
                    }
                    childList.push(childObj);
                }
            }
        }

        return Array.from(map.values());
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

function getSqlParts(root: BaseModel, joinTableMap: Record<string, number>) {
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
                    selectCols.push(`"${tableName}".${field} AS ${tableName}_${field}`);
                }
            } else if (field instanceof BaseModel) {
                const childTable = field.constructor.name.toLowerCase();
                const tables = [tableName, childTable].sort();
                const joinTableName = tables.join('_');
                const hasJoinTable = joinTableMap[joinTableName];

                if (hasJoinTable) {
                    if (!joinedTables.has(joinTableName)) {
                        joins.push(`LEFT JOIN "${joinTableName}" ON "${tableName}".id = "${joinTableName}".${tableName}_id`);
                        joinedTables.add(joinTableName);
                    }
                    if (!joinedTables.has(childTable)) {
                        const baseJoin = `"${joinTableName}".${childTable}_id = "${childTable}".id`;
                        const extra = field.getOnStatement();
                        const extraArgs = field.getOnArgs();
                        let joinCond = baseJoin;
                        if (extra) {
                            const remapped = remapPlaceholders(extra, paramCounter);
                            joinCond += ' AND ' + remapped.sql;
                            allArgs.push(...extraArgs);
                            paramCounter += extraArgs.length;
                        }
                        joins.push(`LEFT JOIN "${childTable}" ON ${joinCond}`);
                        joinedTables.add(childTable);
                    }
                } else {
                    if (!joinedTables.has(childTable)) {
                        const baseJoin = `"${tableName}".id = "${childTable}".${tableName}_id`;
                        const extra = field.getOnStatement();
                        const extraArgs = field.getOnArgs();
                        let joinCond = baseJoin;
                        if (extra) {
                            const remapped = remapPlaceholders(extra, paramCounter);
                            joinCond += ' AND ' + remapped.sql;
                            allArgs.push(...extraArgs);
                            paramCounter += extraArgs.length;
                        }
                        joins.push(`LEFT JOIN "${childTable}" ON ${joinCond}`);
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
function dynamicGroup(rows, levels, names = []) {
    function groupLevel(data, depth) {
        if (depth >= levels.length) return data;

        const key = levels[depth]; // e.g. role_id
        const grouped = new Map();

        for (const row of data) {
            const groupKey = row[key];
            if (!grouped.has(groupKey)) {
                grouped.set(groupKey, []);
            }
            grouped.get(groupKey).push(row);
        }

        const result = [];

        for (const [groupKey, groupRows] of grouped) {
            const first = groupRows[0];
            const entry = { [key]: groupKey };

            // ✅ 仅拷贝当前 key 对应的字段（如 role_id 拷贝 role_name）
            const prefix = key.replace(/_id$/, '');
            for (const k in first) {
                if (k !== key && k.startsWith(prefix)) {
                    entry[k] = first[k];
                }
            }

            // 递归处理下一层
            const children = groupLevel(groupRows, depth + 1);
            if (Array.isArray(children) && children.length > 0) {
                const nextKey = levels[depth + 1];
                if (nextKey) {
                    const fieldName =
                        names[depth] ||
                        (nextKey.endsWith('_id') ? nextKey.replace(/_id$/, 's') : nextKey + 's');
                    entry[fieldName] = children;
                }
            }

            result.push(entry);
        }

        return result;
    }

    return groupLevel(rows, 0);
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
const mockDbRows = [
    {
        user_id: 42,
        user_name: 'Alice',
        role_id: 3,
        role_name: 'Admin',
        permission_id: 5,
        permission_code: 'write',
    },
    {
        user_id: 42,
        user_name: 'Alice',
        role_id: 3,
        role_name: 'Admin',
        permission_id: 6,
        permission_code: 'read',
    },
    {
        user_id: 42,
        user_name: 'Alice',
        role_id: 4,
        role_name: 'User',
        permission_id: null,
        permission_code: null,
    }
];

// 使用示例
(async () => {
    const rs = await User.sel('id','name',Role.sel('id','name',Permission.sel('id','name'))).get`role.id = ${1}`;
    console.log(JSON.stringify(rs));
/*    const user = User.sel('id', 'name', Role.sel('id', 'name',Permission.sel('id','name')).on`role.status = ${1}`);
    const jsonResult = user.mapRowsToJson(mockDbRows);
    console.log(JSON.stringify(jsonResult, null, 2));*/
})();
