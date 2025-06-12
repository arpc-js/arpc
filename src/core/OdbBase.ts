let sql
let asyncLocalStorage= new (require('async_hooks').AsyncLocalStorage)()
function ctx(k: 'req' | 'session' | 'userId'|'tx'): Request | any {
    if (k == 'req') {
        return asyncLocalStorage.getStore()?.[k] as Request
    }
    return asyncLocalStorage.getStore()?.[k]
}
//声明式事务
export function tx(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value  =async function (...args: any[]) {
        let rsp=await sql.begin(async tx => {
            // All queries in this function run in a transaction
            let result = null
            await asyncLocalStorage.run({rid: Date.now(),tx:tx}, async () => {
                result =await originalMethod.apply(this,  args);
            })
            return result;
        });
        return rsp
    };
    return descriptor;
}
//懒加载sqlpool，防止vite node构建导入bun的sql报错
//同时返回事务还是sql
export function getsql() {
    if (!sql){
        if (typeof window==undefined){
            return
        }
        const { SQL } = require("bun");
        sql= new SQL({
            // Pool configuration
            url: `postgres://postgres:root@127.0.0.1:5432/postgres`,
            max: 20, // Maximum 20 concurrent connections
            idleTimeout: 30, // Close idle connections after 30s
            maxLifetime: 3600, // Max connection lifetime 1 hour
            connectionTimeout: 10, // Connection timeout 10s
        });
    }
    return ctx('tx')?ctx('tx'):sql
}

export class OdbBase<T> {
    static async migrate(pname='',created=[]) {
        //有pname说明我是子表，子表的pname是多个代表多对多要额外建立关系表
        //补充改表名，添加字段，删除字段，修改字段名称和类型，索引，自动迁移
        if (created.includes(this.name)){
            return
        }
        created.push(this.name)
        delete this['meta']['plugin']
        let sql=getsql()
        let attrs=this['meta']
        if (attrs[pname+'s']?.includes('[]')){
            //子有多个父多对多，有bug还可能是多对1，两边都是多
            //一对多，反过来看一对一，1对多
            //一对多，反过来看1多多，代表多对多
            let list=[pname,this.name].sort()
            let rtable=`${list[0]}_${list[1]}`
            let statement=`create table if not exists "${rtable}"(${pname}_id integer,${this.name}_id integer)`
            await sql.unsafe(statement)
        }
        let body = Object.entries(attrs).map(([k, v]) => {
            let type = this['meta'][k]
            if (k == 'id') {
                return `id SERIAL PRIMARY KEY`
            } else if (type == 'bigint[]') {
                return `"${k}" integer []`
            } else if (type == 'string[]') {
                return `"${k}" varchar []`
            } else if (type == 'any') {
                return `"${k}" jsonb`
            } else if (type == 'bigint') {
                return `"${k}" integer`
            } else if (type == 'string') {
                return `"${k}" varchar`
            } else if (type == 'number') {
                return `"${k}" double precision`
            }else if (type == 'Date') {
                return `"${k}" TIMESTAMPTZ`
            }else {//操作子表
                type=type.replaceAll('[]','')
                import(`../api/${type}`).then((cls) => {
                    const targetClass = cls[type]
                    targetClass.migrate(this.name.toLowerCase(),created)
                })
                return ''
            }
        })
        body=body.filter(x=>{return x!=''})
        let statement=`create table if not exists "${this.name}"(${body})`
        console.log(statement)
        await sql.unsafe(statement)
    }

    //先插入主表，递归插入子表，递归分2种，1对1/多和多对多，多对多多了个关系表
    async add() {
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        let sql=getsql()
        //@ts-ignore
        const { id, ...rest } = this;

        const [newUser] = await sql`INSERT INTO ${sql(table)} ${sql(rest)} RETURNING *`;
        this['id']=newUser['id']
        //递归插入子表
        //sub.addWithPid(pid)
        //若list的子对象不需要递归，sub.addManyWithPid(pid)，需要递归循环递归
        return this
    }
    async addWithPid() {
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        let sql=getsql()
        //@ts-ignore
        const { id, ...rest } = this;

        const [newUser] = await sql`INSERT INTO ${sql(table)} ${sql(rest)} RETURNING *`;
        this['id']=newUser['id']
        //递归插入子表
        //sub.add()
        return this
    }
    async addManyWithPid() {
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        let sql=getsql()
        //@ts-ignore
        const { id, ...rest } = this;

        const [newUser] = await sql`INSERT INTO ${sql(table)} ${sql(rest)} RETURNING *`;
        this['id']=newUser['id']
        //递归插入子表
        //sub.add()
        return this
    }
    async addOne(obj) {
        const table = obj.constructor.name; // 动态获取表名（如 'User'）
        let sql=getsql()
        //@ts-ignore
        const { id, ...rest } = obj;
        const [newUser] = await sql`INSERT INTO ${sql(table)} ${sql(rest)} RETURNING *`;
        obj['id']=newUser['id']
        return obj
    }
    static async add(data) {
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        //@ts-ignore
        let rest=data.map(x=>{
            let {id,...rest}=x
            return rest
        })
        await sql`INSERT INTO ${sql(table)} ${sql(rest)} RETURNING *`;
    }
    //防止sql注入
    async get(strings, ...values) {
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        const cols = sql`*`; // 默认查询列
        // 动态生成 WHERE 条件（自动处理用户模板）
        const where = values.length > 0 ? sql`where ${sql(strings, ...values)}` : sql``;
        // 组合完整 SQL 并执行
        let [one]=await sql`SELECT ${cols} FROM ${sql(table)} ${where}`
        return one
    }
    //meta数据格式:name: 'string',posts: 'Post[]', // 多对多或一对多，profile: 'Profile' // 一对一
    //class的结构和meta类型结构类似prisam结构
    //sel(***)自动构建嵌套子对象
    //构建主表sql
    //递归构建子表joins和on条件//分1对1/多和多对多2中情况，多对多先join关系再join子表
    //reduce聚合为嵌套json
    //get,getwithType
    async gets(strings, ...values) {
        let meta=this.constructor['meta']
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        const cols = sql`*`; // 默认查询列
        // 动态生成 WHERE 条件（自动处理用户模板）
        const where = values.length > 0 ? sql`where ${sql(strings, ...values)}` : sql``;
        // 组合完整 SQL 并执行
        await sql`SELECT ${cols} FROM ${sql(table)} ${where} order by id desc`;
        return
    }
    async getById(id=0) {
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        const cols = sql`*`; // 默认查询列
        // 动态生成 WHERE 条件（自动处理用户模板）
        // 组合完整 SQL 并执行
        id=id||this['id']
        let [one]=await sql`SELECT ${cols} FROM ${sql(table)} where id=${id}`
        return one;
    }
    async getAnd() {
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        const cols = sql`id, name`; // 默认查询列
        //@ts-ignore
        const where = Object.keys(this).filter(x=>this[x]!=undefined).reduce((acc,  current, index) => {
            let wherecurrent=sql`${sql(current)}=${this[current]}`
            if (index === 0) {
                return wherecurrent
            }
            return sql`${acc} and ${wherecurrent}`;
        }, null);
        // 组合完整 SQL 并执行
        return await sql`SELECT ${cols} FROM ${sql(table)} where ${where}`;
    }
    async getOr() {
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        const cols = sql`id, name`; // 默认查询列
        //@ts-ignore
        const where = Object.keys(this).filter(x=>this[x]!=undefined).reduce((acc,  current, index) => {
            let wherecurrent=sql`${sql(current)}=${this[current]}`
            if (index === 0) {
                return wherecurrent
            }
            return sql`${acc} or ${wherecurrent}`;
        }, null);
        // 组合完整 SQL 并执行
        return await sql`SELECT ${cols} FROM ${sql(table)} where ${where}`;
    }
    test(strings, ...values){
        console.log(strings,values)
        return sql(strings, ...values)
    }
    async  del(ks,...vs) {
        let sql=getsql()
        let conn=ctx('tx')?ctx('tx'):sql
        let table = this.constructor.name
        let cols = sql`id,name`
        const where = vs.length > 0 ? sql`where ${sql(ks, ...vs)}` : sql``;
        return await conn`delete from ${sql(table)} ${where}`
    }
    async delById(id=0) {
        let sql=getsql()
        const table = this.constructor.name; // 动态获取表名（如 'User'）
        id=id||this['id']
        return await sql`delete from ${sql(table)} where id=${id}`;
    }
    //改所有子元素，然后改父元素，
    //子元素有增(无id),删(-id)，改(对象有id),查(id查出对象)
    //
    async  update(ks,...vs) {
        let sql=getsql()
        let table = this.constructor.name
        console.log('this:',this)
        //undefined才是未赋值，null，0，空字符串都是有值，0也可以是一种状态
        let cols=Object.keys(this).filter((k) =>this[k]!=undefined)
        console.log('cols:',cols)
        const where = vs.length > 0 ? sql`where ${sql(ks, ...vs)}` : sql``;
        console.log('where:',where)
        //@ts-ignore
        return await sql`update ${sql(table)} set ${sql(this,...cols)} ${where} RETURNING *`
    }
    async  updateById(id=0) {
        let sql=getsql()
        let table = this.constructor.name
        let cols=Object.keys(this).filter((k) =>this[k]!=undefined)
        console.log(cols)
        id=id||this['id']
        const [obj] =await sql`update ${sql(table)} set ${sql(this,...cols)} where id=${id} RETURNING *`
        //@ts-ignore
        return obj
    }
}

//执行自己，向下递归，可以传入父id，可返回子id
async function addr(data) {
    //根元素是add，子元素可以是add，get，update方式返回成功对象，然后关联到关系表
    let p=null//增改查，三种，返回对象
    //若有pid，关联pid
    //若子节点为对象或数组，递归(son，pid，pname)
    for (let key in data) {
        if (Array.isArray(data[key])){
            let sids=data[key].forEach(item  => addr(item));
            const sorted = [data.constructor.name, data[key]].sort();
            let relation_table=`${sorted[0]}_${sorted[1]}`
            const [newUser] = await sql`INSERT INTO ${sql(relation_table)} ${sql(data)} RETURNING *`;

        }else if (typeof data[key]=='object')  {
            let sid=await addr(data[key]);    // 递归处理嵌套属性
            //父id，子id关联到关系表
            const sorted = [data.constructor.name, data[key]].sort();
            let relation_table=`${sorted[0]}_${sorted[1]}`
        }
    }
    return p.id
}
async function updater(data) {
    //根元素是修改，集合对应+-，每个子元素可以是增删改查
    let p=null//增改查，三种，返回对象
    //若有pid，关联pid
    //若子节点为对象或数组，递归(son，pid，pname)
    //新增，和修改才执行循环
    for (let key in data) {
        if (Array.isArray(data[key])){
            let sids=data[key].forEach(item  => updater(item));
            const sorted = [data.constructor.name, data[key]].sort();
            let relation_table=`${sorted[0]}_${sorted[1]}`
            const [newUser] = await sql`INSERT INTO ${sql(relation_table)} ${sql(data)} RETURNING *`;

        }else if (typeof data[key]=='object')  {
            let sid=await updater(data[key]);    // 递归处理嵌套属性
            //父id，子id关联到关系表
            const sorted = [data.constructor.name, data[key]].sort();
            let relation_table=`${sorted[0]}_${sorted[1]}`
        }
    }
    return p.id
}
function extractAndRemove(obj, key) {
    const value = obj[key];
    delete obj[key];
    return value;
}
