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
    id:bigint
    created_at:Date
    updated_at:Date
    is_deleted:boolean //软删除，增加软删除方法，不能查is_deleted的数据
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
        const { selectCols, joins, args: joinArgs, paramCount, groupKeys, groupNames } = getSqlParts(this, joinTableMap);

        let whereSql = '';
        let whereArgs: any[] = [];
        if (isTaggedTemplateCall(strings)) {
            // 标签模板条件
            const prepared = tagToPrepareStatement(strings, values, paramCount + 1);
            whereSql = addTablePrefix(prepared.statement, table);
            whereArgs = prepared.args;
        } else if (typeof strings === 'number') {
            // 按id查询
            whereSql = `"${table}".id = $${paramCount + 1}`;
            whereArgs = [strings];
        } else if (typeof strings === 'object' && strings !== null) {
            // 动态对象条件，拼 AND 关系，自动参数序号偏移
            const conditions: string[] = [];
            const args: any[] = [];
            let idx = paramCount + 1;
            for (const [key, val] of Object.entries(strings)) {
                conditions.push(`"${table}".${key} = $${idx++}`);
                args.push(val);
            }
            whereSql = conditions.join(' AND ');
            whereArgs = args;
        }
        const whereClause = whereSql ? ` WHERE ${whereSql}` : '';

        const text = `SELECT ${selectCols.join(', ')} FROM "${table}" ${joins.join(' ')}${whereClause}`;
        const allArgs = [...joinArgs, ...whereArgs];
        const {rows} = await sql.query(text, allArgs);

        const grouped = dynamicGroup(rows, groupKeys,groupNames);
        return grouped;
    }
    //
    //嵌套级联操作条件只能是id，因为id关联的关系
    async update(strings: TemplateStringsArray, ...values: any[]) {
        const table = this.constructor.name.toLowerCase();
        const { main, oneToOne, oneToMany } = splitFields(this);
        const setKeys = Object.keys(main)
        const setClause = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
        const setValues = Object.values(main)
        const { statement: whereSql, args: whereArgs } = tagToPrepareStatement(strings, values, setValues.length + 1);
        const whereClause = whereSql ? ` WHERE ${whereSql}` : '';
        const text = `UPDATE "${table}" SET ${setClause} ${whereClause} RETURNING *`
        const [rows] = await sql.query(text, [...setValues, ...whereArgs])
        this.id = rows[0]?.id ?? this.id;
        for (const v of Object.values(oneToOne)) {
            //修改并维护关系,或者新增维护关系
            v[`${table}_id`]=this.id
            await v.upsert()
        }
        // 递归插入一对多子对象数组,或多对多
        for (const arr of Object.values(oneToMany)) {
            let sub_table=''
            let ids=[]
            let hasJoinTable
            for (const item of arr) {
                sub_table = item.constructor.name.toLowerCase();
                const joinTableName = [table, sub_table].sort().join('_');
                hasJoinTable = joinTableMap[joinTableName];
                if (!hasJoinTable){//维护11，1n关系
                    item[`${table}_id`]=this.id
                }
                let [row]=await item.upsert()
                if (hasJoinTable){//维护多对多关系
                    const rdata = {[`${table}_id`]: this.id, [`${sub_table}_id`]: row.id}
                    await add(joinTableName,rdata)
                }
                ids.push(row.id)
            }
            await deleteRemovedRelations(table, sub_table, this.id, ids, joinTableMap);
        }
        return rows[0];
    }
    async upsert(){
        return this.id?await this.update`id=${this.id}`:await this.add()
    }
    async add() {
        const table = this.constructor.name.toLowerCase();
        const { main, oneToOne, oneToMany } = splitFields(this);
        // 插入主表
        const [row]=await add(table,main)
        // 插入1对1，如果有id修改对象维护关系，否则插入对象维护关系
        for (const v of Object.values(oneToOne)) {
            v[`${table}_id`]=row.id
            await v.upsert()
        }
        // 遍历所有数组，区分1对多，多多多，如果有id维护关系就行，否则插入并维护关系
        for (const arr of Object.values(oneToMany)) {
            for (const item of arr) {
                let sub_table = item.constructor.name.toLowerCase();
                const joinTableName = [table, sub_table].sort().join('_');
                let hasJoinTable = joinTableMap[joinTableName];
                if (!hasJoinTable){//维护1对多关系
                    item[`${table}_id`]=row.id
                }
                let [item_row]=await item.upsert()
                if (hasJoinTable){//维护多对多关系
                    const rdata = {[`${table}_id`]: row.id, [`${sub_table}_id`]: item_row.id}
                    await add(joinTableName,rdata)
                }
            }
        }
        return row;
    }
    //weekset解决循环依赖
    //不是多对多增加外键，分离，插入主表，是否插入关系表，递归子对象/数组
    async addWithPid(pname: string, pid: number, seen = new WeakSet()) {
        if (seen.has(this)) return this;
        seen.add(this);
        const table = this.constructor.name.toLowerCase();
        const joinTableName = [pname, table].sort().join('_');
        const hasJoinTable = joinTableMap[joinTableName];
        // 判断是否为多对多
        if (!hasJoinTable) {
            this[`${pname}_id`] = pid; // 一对多 / 一对一，直接写外键
        }
        // --- 分离字段 ---
        const main = {}, oneToOne = {}, oneToMany = {};
        for (const [k, v] of Object.entries(this)) {
            if (Array.isArray(v)) oneToMany[k] = v;
            else if (v && typeof v === 'object') oneToOne[k] = v;
            else if (v !== null && v !== undefined) main[k] = v;
        }
        // 插入当前表
        const [row]=await add(table,main)
        // 多对多：插入关系表
        if (hasJoinTable) {
            const rdata = {[`${pname}_id`]: pid, [`${table}_id`]: row.id}
            await add(joinTableName,rdata)
        }

        // 🔁 递归一对一字段
        for (const v of Object.values(oneToOne)) {
            await v.addWithPid(table, row.id, seen);
        }
        // 🔁 递归一对多字段
        for (const arr of Object.values(oneToMany)) {
            for (const item of arr) {
                await item.addWithPid(table,row.id, seen);
            }
        }
        return row;
    }
}
function splitFields(obj) {
    const main = {}, oneToOne = {}, oneToMany = {};
    for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) oneToMany[k] = v;
        else if (v && typeof v === 'object') oneToOne[k] = v;
        else if (v !== null && v !== undefined) main[k] = v;
    }
    return { main, oneToOne, oneToMany };
}
async function syncManyToManyRelations(tableA, tableB, aid, bidList) {
    const joinTableName = [tableA, tableB].sort().join('_');
    const [colA, colB] = [tableA, tableB].sort();

    if (!bidList || bidList.length === 0) {
        // 如果没传任何子 id，删除所有关系
        await sql.query(`
      DELETE FROM "${joinTableName}"
      WHERE "${colA}_id" = $1
    `, [aid]);
        return;
    }

    // 1. 批量插入新关联，冲突时忽略
    const valuesClause = bidList.map((_, i) => `($1, $${i + 2})`).join(', ');
    const params = [aid, ...bidList];

    await sql.query(`
    INSERT INTO "${joinTableName}" ("${colA}_id", "${colB}_id")
    VALUES ${valuesClause}
    ON CONFLICT DO NOTHING
  `, params);

    // 2. 删除没传入的旧关联
    const placeholders = bidList.map((_, i) => `$${i + 2}`).join(', ');
    await sql.query(`
    DELETE FROM "${joinTableName}"
    WHERE "${colA}_id" = $1 AND "${colB}_id" NOT IN (${placeholders})
  `, params);
}
async function deleteRemovedRelations(table, sub_table, this_id, ids, joinTableMap) {
    const joinTableName = [table, sub_table].sort().join('_');
    const hasJoinTable = joinTableMap[joinTableName];

    // 构建 NOT IN 的参数占位符
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(', ');

    if (hasJoinTable) {
        // 多对多：删除中间表中的无效关联
        const sqlText = `
            DELETE FROM "${joinTableName}"
            WHERE ${table}_id = $1 AND ${sub_table}_id NOT IN (${placeholders})
        `;
        await sql.query(sqlText, [this_id, ...ids]);
    } else {
        // 一对多：删除子表中不在 ids 的记录
        const sqlText = `
            DELETE FROM "${sub_table}"
            WHERE ${table}_id = $1 AND id NOT IN (${placeholders})
        `;
        await sql.query(sqlText, [this_id, ...ids]);
    }
}

async function add(table, obj) {
    const keys = Object.keys(obj)
    const cols = keys.map(k => `"${k}"`).join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(obj)
    const text = `INSERT INTO "${table}" (${cols})VALUES (${placeholders}) RETURNING *`
    console.log(text,values)
    const [rows] = await sql.query(text, values)
    return rows
}
/**
 * 给 on 条件里的字段添加表名前缀
 * 简单做法：对形如 id、name 等独立字段加前缀，忽略已有点的字段
 * 可根据业务调整
 */
function addTablePrefix(sql: string, tableName: string): string {
    // 只给独立单词加前缀，排除已经带点号的字段，避免重复前缀
    tableName=`"${tableName}"`
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

    const groupKeys: string[] = [];
    const groupNames: string[] = [];

    joinedTables.add(rootName);

    function walk(model: BaseModel, tableName: string) {
        const sel = model.getSel();

        // 假设每张表都有 id 字段
        groupKeys.push(`${tableName}_id`);
        // 转换为聚合数组字段名（roles、permissions）
        if (groupKeys.length > 1) {
            const lastKey = groupKeys[groupKeys.length - 1];
            const name = lastKey.replace(/_id$/, '');
            groupNames.push(name.endsWith('s') ? name : name + 's');
        }

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

    return {
        selectCols,
        joins,
        args: allArgs,
        paramCount: paramCounter - 1,
        groupKeys,
        groupNames
    };
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
            const entry: any = {};

            // ✅ 设置当前对象的 id 字段为 groupKey
            entry['id'] = groupKey;

            // ✅ 推测当前 prefix，如 role_ / permission_
            const prefix = key.replace(/_id$/, '');

            for (const k in first) {
                if (k !== key && k.startsWith(prefix + '_')) {
                    const strippedKey = k.slice(prefix.length + 1); // 去前缀
                    entry[strippedKey] = first[k];
                }
            }

            // 🔁 递归处理下一层
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
function isTaggedTemplateCall(strings) {
    return (
        Array.isArray(strings) &&
        typeof strings.raw === 'object' &&
        strings.raw.length === strings.length
    )
}




// 模型定义
class Permission extends BaseModel {
    code: string;
}
class Menu extends BaseModel {
    name: string;
    path: string;
}
class Role extends BaseModel {
    name: string;
    permissions: Permission[];
    menus: Menu[];
}
class Order extends BaseModel {
    name: string;
}
class User extends BaseModel {
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
 /*   let user=new User()
    user.name='4'
    let role=new Role()
    role.name='4'
    let order=new Order()
    order.name='4'
    user.role=role
    user.order=order
    user.add()*/
    const user = User.sel('id', 'name', Role.sel('id', 'name',Permission.sel('id','name')).on`id = ${1}`);
    const jsonResult =await user.get`id=${1} and name=${'test'}`;
    console.log(JSON.stringify(jsonResult));
})();
