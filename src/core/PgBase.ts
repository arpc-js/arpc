//@ts-ignore
import { Pool } from 'pg'
const sql = new Pool({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    host: '156.238.240.143',
    port: 5432,
})
export class PgBase {
    static types={}
    id:bigint
    //version:bigint //子类定义，子类有version字段，开启乐观锁，修改失败表示锁冲突
    is_deleted:boolean //软删除，增加软删除方法，不能查is_deleted的数据
    created_at:Date
    updated_at:Date
    #list: any[] = [];
    #sel: any[] = [];
    #where: string | null = null;
    #onStatement: string | null = null;
    #onArgs: any[] = [];
    #page=0
    #size=0
    //支持3星表达式,支持字符串和数组2种格式，字符串的话切分转数组即可
    //支持exclude,通用字符串逗号分割和数组2种方式
    static sel(...fields: any[]): any {
        const instance = new this();
        instance.#sel = fields.length > 0 ? fields : ['**'];
        return instance;
    }
    isManyToMany(that): boolean {
        const thisName = this.constructor.name;
        const thatName = that.constructor.name;
        // this 的类型字段中是否包含 thatName[]
        const thisHasThatMany = Object.values(this.types).some(type => type === `${thatName}[]`);
        // that 的类型字段中是否包含 thisName[]
        const thatHasThisMany = Object.values(that.types).some(type => type === `${thisName}[]`);
        return thisHasThatMany && thatHasThisMany;
    }

     sel(...fields: any[]): any {
        this.#sel = fields
        return this;
    }
    page(page,size): any {
        this.#page = page
        this.#size = size
        return this;
    }
    setSel(...fields: any[]): any {
        this.#sel = fields
        return this;
    }
    table(){
     return this.constructor.name.toLowerCase()
    }
    get types(){
        //@ts-ignore
        return this.constructor.types
    }
    get list(){
        //@ts-ignore
        return this.#list
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

    //id查询，tag查询，动态查询,都没有this.id作为条件,this.id也没有，对象动态查询
    //返回多条，单挑自己解构[user]
    async get(condition: TemplateStringsArray | number | Record<string, any>=undefined, ...values: any[]) {
        console.log(condition)
        console.log(values)
        console.log(this)
        let table = `"${this.constructor.name.toLowerCase()}"`;
        const { selectCols, joins, args: joinArgs, paramCount, groupKeys, groupNames } = getSqlParts(this);

        let { whereClause, whereArgs } = buildWhereClause(this, condition, values, paramCount + 1);

        if (whereClause) {
            whereClause += ` AND ${table}.is_deleted is not true`;
        } else {
            whereClause = `WHERE ${table}.is_deleted is not true`;
        }
        let allArgs = [...joinArgs, ...whereArgs];
        //判断分页，如果有分页就把主表换成分页的,where放前面,参数翻转
        //若是单表查询page加在where后
        if (joins.length>0&&this.#page!=0&&this.#size!=0){
            table=`(select * from ${table} ${whereClause} ORDER BY created_at DESC LIMIT ${this.#size} OFFSET ${(this.#page-1)*this.#size}) as ${table}`;
            whereClause=''
            allArgs = [...whereArgs,...joinArgs];
        }else if (this.#page!=0&&this.#size!=0){
            whereClause=whereClause+` LIMIT ${this.#size} OFFSET ${(this.#page-1)*this.#size}`
        }
        const text = `SELECT ${selectCols.join(', ')} FROM ${table} ${joins.join(' ')}${whereClause}`;
        console.log(text)
        console.log(allArgs)
        const { rows } = await sql.query(text, allArgs);
        console.log(text)
        console.log(groupNames)
        console.log(groupKeys)
        let grouped=rows
        if (groupNames.length > 0) {
             grouped = dynamicGroup(rows, groupKeys, groupNames);
        }
        if (grouped.length == 0) {
            throw new Error('Not Found');
        }
        return grouped;
    }

    async sql(condition: TemplateStringsArray | number | Record<string, any>=undefined, ...values: any[]) {
        let { whereClause, whereArgs } = buildWhereClause(this, condition, values, 1);
        const { rows } = await sql.query(whereClause, whereArgs);
        return rows;
    }
    async query(strings: TemplateStringsArray, ...values: any[]) {
        let { statement, args } = buildSqlClause(strings, values);
        console.log(statement)
        console.log(args)
        const { rows } = await sql.query(statement, args);
        return rows;
    }
    //嵌套级联操作条件只能是id，因为id关联的关系
    //默认单条id操作,有条件代表多条操作
    async update(condition: TemplateStringsArray, ...values: any[]) {
        const table = this.table();
        const { main, oneToOne, oneToMany } = splitFields(this);

        const setKeys = Object.keys(main).filter(k => main[k] !== undefined && main[k] !== null);
        let setClause = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const setValues = setKeys.map(k => main[k]);

        const { whereClause, whereArgs } = buildWhereClause(this, condition, values, setValues.length + 1);

        const text = `UPDATE "${table}" SET ${setClause} ${whereClause} RETURNING *`
        const [rows] = await sql.query(text, [...setValues, ...whereArgs])
        return rows
    }
    //所有对象，包含子对象通过id增删改，无id增，有修改，有is_deleted软删除
    async updateById(id=null) {
        const table = this.constructor.name.toLowerCase();
        const { main, oneToOne, oneToMany } = splitFields(this);
        const setKeys = Object.keys(main).filter(k => main[k] !== undefined && main[k] !== null);
        let setClause = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const setValues = setKeys.map(k => main[k]);

        id = id ?? this.id;
        const text = `UPDATE "${table}" SET ${setClause} where "${table}".id=$${setValues.length+1} RETURNING *`
        const [rows] = await sql.query(text, [...setValues, id])
        if (!rows.length) return
        this.id = rows[0]?.id ?? this.id;
        for (const v of Object.values(oneToOne)) {
            //修改并维护关系,或者新增维护关系
            v[`${table}_id`]=this.id
            //@ts-ignore
            await v.save()//saveOrUpdate
        }
        // 递归插入一对多子对象数组,或多对多
        for (const arr of Object.values(oneToMany)) {
            let sub_table=''
            let ids=[]
            //@ts-ignore
            for (const item of arr) {
                if (!this.isManyToMany(item)){//维护11，1n关系
                    item[`${table}_id`]=this.id
                }
                let [row]=await item.save()
                if (this.isManyToMany(item)){//维护多对多关系
                    const joinTableName = [table, sub_table].sort().join('_');
                    const rdata = {[`${table}_id`]: this.id, [`${sub_table}_id`]: row.id}
                    await add(joinTableName,rdata)
                }
                ids.push(row.id)
            }
            //软删除代替了
            //await deleteRemovedRelations(table, sub_table, this.id, ids, joinTableMap);
        }
        return rows?.[0];
    }
    async updateWithVersion(condition: TemplateStringsArray | number | Record<string, any>, ...values: any[]) {
        const table = this.constructor.name.toLowerCase();
        const { main } = splitFields(this);

        // 过滤要更新的字段
        const setKeys = Object.keys(main).filter(k => main[k] !== undefined && main[k] !== null);
        let setClause = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const setValues = setKeys.map(k => main[k]);

        // 用 buildWhereClause 构造初步 where 条件和参数
        const { whereClause: baseWhereClause, whereArgs: baseWhereArgs } = buildWhereClause(this, condition, values, setValues.length + 1);

        // version 乐观锁逻辑
        let whereClause = baseWhereClause;
        let whereArgs = [...baseWhereArgs];
        //@ts-ignore
        if ('version' in this) {
            // 拼接 SET 子句增加 version 自增
            setClause += (setClause ? ', ' : '') + `"version" = "version" + 1`;
            // 拼接 WHERE 条件 version = 当前版本号
            if (whereClause) {
                whereClause += ` AND "version" = $${setValues.length + whereArgs.length + 1}`;
            } else {
                whereClause = ` WHERE "version" = $${setValues.length + whereArgs.length + 1}`;
            }
            //@ts-ignore
            whereArgs.push(this.version);
        }

        const text = `UPDATE "${table}" SET ${setClause} ${whereClause} RETURNING *`;
        const [rows] = await sql.query(text, [...setValues, ...whereArgs]);

        return rows?.[0];
    }
    async del(condition: TemplateStringsArray | number | Record<string, any>, ...values: any[]) {
        const table = this.table()

        const { whereClause, whereArgs } = buildWhereClause(this, condition, values, 1);

        const text = `DELETE FROM "${table}"${whereClause} RETURNING *`;
        const { rows } = await sql.query(text, whereArgs);

        return rows;
    }
    async softDel(condition: TemplateStringsArray | number | Record<string, any>, ...values: any[]) {
        const table = this.table();
        const isDeletedValue = true; // 或者 1，根据你的字段类型

        // SET 子句固定：设置 is_deleted = true
        const setClause = `"is_deleted" = $1`;
        const setValues = [isDeletedValue];

        // 构造 where 条件，从 param 索引从1开始
        const { whereClause, whereArgs } = buildWhereClause(this, condition, values, 2);

        const text = `UPDATE "${table}" SET ${setClause} ${whereClause} RETURNING *`;

        const [rows] = await sql.query(text, [...setValues, ...whereArgs]);
        return rows;
    }

    //save应用层saveOrUpdate
    async save(){
        return this.id?await this.update`id=${this.id}`:await this.add()
    }
    //数据库层，可以任意字段冲突
    async upsert(){
        return
    }
    async add() {
        console.log(this.types)
        const table = this.constructor.name.toLowerCase();
        const { main, oneToOne, oneToMany } = splitFields(this);
        // 插入主表
        const [row]=await add(table,main)
        // 插入1对1，如果有id修改对象维护关系，否则插入对象维护关系
        for (const v of Object.values(oneToOne)) {
            v[`${table}_id`]=row.id
            //@ts-ignore
            await v.save()
        }
        // 遍历所有数组，区分1对多，多多多，如果有id维护关系就行，否则插入并维护关系
        for (const arr of Object.values(oneToMany)) {
            //@ts-ignore
            for (const item of arr) {
                if (!this.isManyToMany(item)){//维护1对多关系
                    item[`${table}_id`]=row.id
                }
                let [item_row]=await item.save()
                if (this.isManyToMany(item)){//维护多对多关系
                    let sub_table = item.constructor.name.toLowerCase();
                    const joinTableName = [table, sub_table].sort().join('_');
                    const rdata = {[`${table}_id`]: row.id, [`${sub_table}_id`]: item_row.id}
                    await add(joinTableName,rdata)
                }
            }
        }
        return [row];
    }
}
export function buildSqlClause(strings: TemplateStringsArray, values: any[]) {
    let statement = '';
    const args: any[] = [];
    for (let i = 0; i < strings.length; i++) {
        statement += strings[i];
        if (i < values.length) {
            args.push(values[i]);
            statement += `$${args.length}`; // PostgreSQL uses $1, $2, ...
        }
    }
    return { statement, args };
}

function buildWhereClause(
    obj,
    conditionInput,
    values: any[],
    paramStartIndex: number
) {
    let table=obj.table()
    let whereSql = '';
    let whereArgs: any[] = [];

    if (isTaggedTemplateCall(conditionInput,values)) {
        const prepared = tagToPrepareStatement(conditionInput, values, paramStartIndex);
        whereSql = addTablePrefix(prepared.statement, table);
        whereArgs = prepared.args;
    } else if (typeof conditionInput === 'number') {
        whereSql = `"${table}".id = $${paramStartIndex}`;
        whereArgs = [conditionInput];
    } else if (typeof conditionInput === 'object' && conditionInput !== null) {
        const conditions: string[] = [];
        const args: any[] = [];
        let idx = paramStartIndex;
        for (const [key, val] of Object.entries(conditionInput)) {
            conditions.push(`"${table}".${key} = $${idx++}`);
            args.push(val);
        }
        whereSql = conditions.join(' AND ');
        whereArgs = args;
    } else if (obj.id) {//什么条件都没有，默认对象id为条件
        whereSql = `"${table}".id = $${paramStartIndex}`;
        whereArgs = [obj.id];
    }else {
        const conditions: string[] = [];
        const args: any[] = [];
        let idx = paramStartIndex;
        for (const [key, val] of Object.entries(obj)) {
            if (val !== undefined && val !== null) {
                conditions.push(`"${table}".${key} = $${idx++}`);
                args.push(val);
            }
        }
        whereSql = conditions.join(' AND ');
        whereArgs = args;
    }

    return { whereClause:whereSql ? ` WHERE ${whereSql}` : '', whereArgs };
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
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined && obj[k] !== null)
    const cols = keys.map(k => `"${k}"`).join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(obj)
    const text = `INSERT INTO "${table}" (${cols})VALUES (${placeholders}) RETURNING *`
    console.log(text,values)
    const {rows} = await sql.query(text, values)
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

function getSqlParts(root: PgBase) {
    const rootName = root.constructor.name.toLowerCase();
    let selectCols: string[] = [];
    const joins: string[] = [];
    const joinedTables = new Set<string>();
    const allArgs: any[] = [];
    let paramCounter = 1;

    const groupKeys: string[] = [];
    const groupNames: string[] = [];

    joinedTables.add(rootName);

    function walk(model: PgBase, tableName: string) {
        const sel = model.getSel();
        console.log(`sel:`,sel)
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
            } else if (field instanceof PgBase) {
                const childTable = field.constructor.name.toLowerCase();
                const tables = [tableName, childTable].sort();
                const joinTableName = tables.join('_');
                if (model.isManyToMany(field)) {
                    if (!joinedTables.has(joinTableName)) {
                        joins.push(`LEFT JOIN "${joinTableName}" ON "${tableName}".id = "${joinTableName}".${tableName}_id`);
                        joinedTables.add(joinTableName);
                    }
                    if (!joinedTables.has(childTable)) {
                        const baseJoin = `"${joinTableName}".${childTable}_id = "${childTable}".id and "${childTable}".is_deleted is not true`;
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
                        const baseJoin = `"${tableName}".id = "${childTable}".${tableName}_id and "${childTable}".is_deleted is not true`;
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
    selectCols=selectCols.length==0?['*']:selectCols
    return {
        selectCols,
        joins,
        args: allArgs,
        paramCount: paramCounter - 1,
        groupKeys,
        groupNames
    };
}


function tagToPrepareStatement(strings, values: any[], startIndex = 1) {
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
function isTaggedTemplateCall(strings,values) {
    return (
        Array.isArray(strings)&&Array.isArray(strings)
        //@ts-ignore
        //typeof strings.raw === 'object' &&
        //@ts-ignore
        //strings.raw.length === strings.length
    )
}




// 模型定义
class Permission extends PgBase {
    code: string;
}
class Menu extends PgBase {
    name: string;
    path: string;
}
class Role extends PgBase {
    name: string;
    permissions: Permission[];
    menus: Menu[];
}
class Order extends PgBase {
    name: string;
}
class User extends PgBase {
    name: string;
    roles: Role[];
    orders: Order[];
}

// 多对多关系映射表

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
/*(async () => {
 /!*   let user=new User()
    user.name='4'
    let role=new Role()
    role.name='4'
    let order=new Order()
    order.name='4'
    user.role=role
    user.order=order
    user.add()*!/
    const user = User.sel('id', 'name', Role.sel('id', 'name',Permission.sel('id','name')).on`id = ${1}`);
    const jsonResult =await user.get`id=${1} and name=${'test'}`;
    console.log(JSON.stringify(jsonResult));
})();*/
