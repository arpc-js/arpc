//@ts-ignore
import { Pool } from 'pg'
import {AsyncLocalStorage} from "async_hooks";
const sql = new Pool({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    host: '156.238.240.143',
    port: 5432,
})
let asyncLocalStorage= new AsyncLocalStorage()
function ctx(k: 'tx'): Request | any {
    return asyncLocalStorage.getStore()?.[k]
}
//声明式事务,封装了编程事务
//上下文+装饰器
export function tx(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        const client = await sql.connect(); // 正确获取连接（来自连接池）
        try {
            await client.query('BEGIN');
            let result;
            await asyncLocalStorage.run({ tx: client }, async () => {
                result = await originalMethod.apply(this, args);
            });
            await client.query('COMMIT');
            return result;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release(); // 释放连接（回归连接池）
        }
    };
}
//同时返回事务还是sql
export function getsql() {
    return ctx('tx')||sql
}
export class PgBase {
    // 定义非枚举属性的工具方法
    setHiddenProp(key: string, value: any) {
        Object.defineProperty(this, key, {
            value,
            writable: true,
            configurable: true,
            enumerable: false, // ✅ 不可枚举，不会进数据库
        });
    }
    static types={}
    id:bigint
    is_deleted:boolean //软删除，增加软删除方法，不能查is_deleted的数据
    created_at:Date
    updated_at:Date
    #sel: any[] = [];
    #where: string | null = null;
    #onStatement: string | null = null;
    #onArgs: any[] = [];
/*    #page=1
    #size=10*/
    #list: any[] = [];
    #total=0
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
    set set_sel(value: any[]) {
        if (!Array.isArray(value)) {
            throw new TypeError('sel must be an array');
        }
        console.log(value)
    }
/*    page(page,size): any {
        this.#page = page
        this.#size = size
        return this;
    }*/
    setSel(...fields: any[]): any {
        this.#sel = fields
        return this;
    }
    get table(){
     return this.constructor.name.toLowerCase()
    }
    get types(){
        //@ts-ignore
        return this.constructor.types
    }
    get props(){
        //@ts-ignore
        return this.constructor.props
    }
    get list(){
        //@ts-ignore
        return this.#list
    }
    get total(){
        //@ts-ignore
        return this.#total
    }
    get page() {
        //@ts-ignore
        return this._page ?? 1;
    }

    set page(val: number) {
        this.setHiddenProp('_page', val);
    }

    get size() {
        //@ts-ignore
        return this._size ?? 10;
    }

    set size(val: number) {
        this.setHiddenProp('_size', val);
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
            this.#onStatement = addTablePrefix(strings, this.table);
            this.#onArgs = [];
        } else {
            // 标签模板，先转换，再加前缀
            const { statement, args } = tagToPrepareStatement(strings, values, 1);
            const withPrefix = addTablePrefix(statement, this.table);
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
    reset(): any {

    }

    static async get(condition: TemplateStringsArray | number | Record<string, any>=undefined, ...values: any[]) {
       return await this.sel('*').get(condition,values)
    }
        //id查询，tag查询，动态查询,都没有this.id作为条件,this.id也没有，this对象动态查询
    //返回多条，单挑自己解构[user]
    static async getPage(){
        let obj=this.sel('*')
        let list=await obj.get()
        let total=await obj.count()
        return {list,total}
    }
    async getPage(){
        let list=await this.get()
        let total=await this.count()
        return {list,total}
    }
    async count(condition: TemplateStringsArray | number | Record<string, any> = undefined, ...values: any[]) {
        let table = `"${this.table}"`;
        const { joins, args: joinArgs, paramCount } = getSqlParts(this);
        let { whereClause, whereArgs } = buildWhereClause(this, condition, values, paramCount + 1);

        // 加上 is_deleted 条件
        if (whereClause) {
            whereClause += ` AND ${table}.is_deleted IS NOT TRUE`;
        } else {
            whereClause = `WHERE ${table}.is_deleted IS NOT TRUE`;
        }
        const allArgs = [...joinArgs, ...whereArgs];
        const text = `SELECT COUNT(*) FROM ${table} ${joins.join(' ')} ${whereClause}`;
        const { rows } = await getsql().query(text, allArgs);
        return Number(rows[0].count);
    }
    async get(condition: TemplateStringsArray | number | Record<string, any>=undefined, ...values: any[]) {
        console.log(condition)
        console.log(values)
        console.log(this)
        let table = `"${this.table}"`;
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
        if (joins.length>0&&this.page!=0&&this.size!=0){
            table=`(select * from ${table} ${whereClause} ORDER BY id DESC LIMIT ${this.size} OFFSET ${(this.page-1)*this.size}) as ${table}`;
            whereClause=''
            allArgs = [...whereArgs,...joinArgs];
        }else if (this.page!=0&&this.size!=0){
            whereClause=whereClause+` ORDER BY id DESC LIMIT ${this.size} OFFSET ${(this.page-1)*this.size}`
        }
        const text = `SELECT ${selectCols.join(', ')} FROM ${table} ${joins.join(' ')}${whereClause}`;
        console.log(text)
        console.log(allArgs)
        const { rows } = await getsql().query(text, allArgs);
        console.log(text)
        console.log(groupNames)
        console.log(groupKeys)
        console.log(rows)
        let grouped=rows
        if (grouped.length == 0) {
            throw new Error('Not Found');
        }
        if (groupNames.length > 0) {
             grouped = dynamicGroup(rows, groupKeys, groupNames);
        }else {
            grouped = JSON.parse(JSON.stringify(grouped).replaceAll(`${this.table}_`, ''))
        }
        return grouped;
    }

    async sql(condition: TemplateStringsArray | number | Record<string, any>=undefined, ...values: any[]) {
        let { whereClause, whereArgs } = buildWhereClause(this, condition, values, 1);
        const { rows } = await getsql().query(whereClause, whereArgs);
        return rows;
    }
    async query(strings: TemplateStringsArray, ...values: any[]) {
        let { statement, args } = buildSqlClause(strings, values);
        console.log(statement)
        console.log(args)
        const { rows } = await getsql().query(statement, args);
        return rows;
    }
    //嵌套级联操作条件只能是id，因为id关联的关系
    //默认单条id操作,有条件代表多条操作
    async update(condition: TemplateStringsArray | number | Record<string, any>=null,...values: any[]) {
        const table = this.table
        const { main, oneToOne, oneToMany } = splitFields(this);

        const setKeys = Object.keys(main).filter(k => main[k] !== undefined && main[k] !== null);
        let setClause = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const setValues = setKeys.map(k => main[k]);

        const { whereClause, whereArgs } = buildWhereClause(this, condition, values, setValues.length + 1);
        const text = `UPDATE "${table}" SET ${setClause} ${whereClause} RETURNING *`

        const {rows} = await getsql().query(text, [...setValues, ...whereArgs])
        return rows
    }
    //所有对象，包含子对象通过id增删改，无id增，有修改，有is_deleted软删除
    async del(condition: TemplateStringsArray | number | Record<string, any>=null, ...values: any[]) {
        this.is_deleted=true
        return await this.update(condition,...values);
    }
    //递归ar增删改操作
    //角色权限嵌套多表，加声明式事务
    @tx
    async sync() {
        return await this._sync();
    }
    //防止声明式事务无限递归
    async _sync() {
        console.log(this.types)
        const table = this.table
        const { main, oneToOne, oneToMany } = splitFields(this);
        // 插入主表
        const [row]=this.id?await this.update():await add(table,main)
        // 插入1对1，如果有id修改对象维护关系，否则插入对象维护关系
        for (const v of Object.values(oneToOne)) {
            v[`${table}_id`]=row.id
            //@ts-ignore id判断增改，is_delete的改是删除
            await v._sync()
        }
        // 遍历所有数组，区分1对多，多多多，如果有id维护关系就行，否则插入并维护关系
        for (const arr of Object.values(oneToMany)) {
            //@ts-ignore
            for (const item of arr) {
                if (!this.isManyToMany(item)){//维护1对多关系
                    item[`${table}_id`]=row.id
                }
                //@ts-ignore id判断增改，is_delete的改是删除
                let [item_row]=await item._sync()
                //insert confict do nothing 维护多对多关系，删除不需要维护新关系
                if (this.isManyToMany(item)&&!item_row.is_deleted){
                    let sub_table = item.constructor.name.toLowerCase();
                    const joinTableName = [table, sub_table].sort().join('_');
                    const rdata = {[`${table}_id`]: row.id, [`${sub_table}_id`]: item_row.id}
                    await add(joinTableName,rdata)
                }
            }
        }
        return [row];
    }
    @tx
    async cover() {
        return await this._cover();
    }
    //防止声明式事务无限递归
    async _cover() {
        console.log(this.types)
        const table = this.table
        const { main, oneToOne, oneToMany } = splitFields(this);
        // 插入主表
        const [row]=this.id?await this.update():await add(table,main)
        // 插入1对1，如果有id修改对象维护关系，否则插入对象维护关系
        for (const v of Object.values(oneToOne)) {
            v[`${table}_id`]=row.id
            //@ts-ignore id判断增改，is_delete的改是删除
            await v._sync()
            //解引用
        }
        // 遍历所有数组，区分1对多，多多多，如果有id维护关系就行，否则插入并维护关系
        for (const arr of Object.values(oneToMany)) {
            //@ts-ignore
            for (const item of arr) {
                if (!this.isManyToMany(item)){//维护1对多关系
                    item[`${table}_id`]=row.id
                    //解引用
                }
                //@ts-ignore id判断增改，is_delete的改是删除
                let [item_row]=await item._sync()
                //insert confict do nothing 维护多对多关系，删除不需要维护新关系
                if (this.isManyToMany(item)&&!item_row.is_deleted){
                    let sub_table = item.constructor.name.toLowerCase();
                    const joinTableName = [table, sub_table].sort().join('_');
                    const rdata = {[`${table}_id`]: row.id, [`${sub_table}_id`]: item_row.id}
                    await add(joinTableName,rdata)
                    //解引用
                    let sql=getsql()
                    //@ts-ignore
                    let text = `update ${joinTableName} set is_deleted=true where ${table}_id=${row.id} and ${sub_table}_id not in (${arr.map(i => i.id).join(',')})`
                    await sql.query(text)
                }
            }
        }
        return [row];
    }
    //数据库层，可以任意字段冲突
    async add() {
        console.log(this.types)
        const table = this.table
        const { main, oneToOne, oneToMany } = splitFields(this);
        // 插入主表
        const [row]=await add(table,main)
        return [row];
    }
    async adds(arr) {
        const table = this.table;
        if (!arr.length) return [];
        const keys = Object.keys(arr[0]).filter(k => arr[0][k] != null);
        const cols = keys.map(k => `"${k}"`).join(',');
        const placeholders = arr.map((_, i) =>
            `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(',')})`
        ).join(',');
        const values = arr.flatMap(obj => keys.map(k => obj[k]));
        const text = `INSERT INTO "${table}" (${cols}) VALUES ${placeholders} RETURNING *`;
        const { rows } = await getsql().query(text, values);
        return rows;
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
    let table=obj.table
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
            if (val !== undefined && val !== null&& typeof val!== "object") {
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

async function add(table, obj) {
    const keys = Object.keys(obj).filter(k => obj[k] !== undefined && obj[k] !== null)
    const cols = keys.map(k => `"${k}"`).join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(obj)
    const text = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING RETURNING *`
    console.log(text,values)
    const {rows} = await getsql().query(text, values)
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
        let sel = model.getSel();
        sel = sel?.[0] !== undefined ? sel : ['*'];
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
                if (field === '*') {
                    selectCols.push(`"${tableName}".*`);
                } else {
                    selectCols.push(`"${tableName}".${field} AS ${tableName}_${field}`);
                }
            } else if (field instanceof PgBase) {
                const childTable = field.constructor.name.toLowerCase();
                const tables = [tableName, childTable].sort();
                const joinTableName = tables.join('_');
                if (model.isManyToMany(field)) {
                    if (!joinedTables.has(joinTableName)) {
                        joins.push(`LEFT JOIN "${joinTableName}" ON "${tableName}".id = "${joinTableName}".${tableName}_id and "${joinTableName}".is_deleted is not true`);
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
export function prop(meta: Record<string, any> = {}) {
    return function (target: any, key: string) {
        meta.key=key
        // 存储每个字段的元信息
        if (!target.constructor.props) {
            target.constructor.props = {};
        }
        target.constructor.props[key] = meta;
    };
}

export function menu(meta: string | { name: string; parent?: string; icon?: string; order?: number }) {
    return function (target: any) {
        if (typeof meta === 'string') {
            target.menu = {name: meta};
        } else {
            target.menu = meta;
        }
    };
}

