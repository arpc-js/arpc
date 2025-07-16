//@ts-ignore
import { Pool } from 'pg'
import { AsyncLocalStorage } from 'async_hooks'

let pg_pool: Pool | null = null
const asyncLocalStorage = new AsyncLocalStorage()

function ctx(k: 'tx') {
    return asyncLocalStorage.getStore()?.[k]
}

// 判断SQL类型，决定是否执行
function getMode(sqlText: string) {
    const low = sqlText.trim().toLowerCase()
    if (low.startsWith('select')) return 'select'
    if (low.startsWith('insert')) return 'insert'
    if (low.startsWith('update')) return 'update'
    if (low.startsWith('delete')) return 'delete'
    return 'other'
}

// 编译标签模板
function compile(strings: TemplateStringsArray, values: any[]) {
    let text = ''
    const params: any[] = []
    let paramIndex = 1

    // 简单判断insert/update，用来拼接对象
    let mode: string | null = null
    for (const s of strings) {
        const sLow = s.toLowerCase()
        if (sLow.includes('insert into')) mode = 'insert'
        if (sLow.includes('update ')) mode = 'update'
    }

    for (let i = 0; i < strings.length; i++) {
        text += strings[i]

        if (i < values.length) {
            const raw = values[i]

            // 如果是子SQL片段
            if (raw?.__sql && raw.raw) {
                // 合并子SQL的text和参数，且参数编号调整
                text += raw.text
                params.push(...raw.params)
                paramIndex += raw.params.length
            }
            // 如果是标记为片段但没raw（一般是条件）
            else if (raw?.__sql) {
                const val = raw.val
                if (Array.isArray(val)) {
                    text += val.map(k => `"${k}"`).join(', ')
                } else if (typeof val === 'string') {
                    text += val.split(',').map(k => `"${k.trim()}"`).join(', ')
                } else if (typeof val === 'object') {
                    const keys = Object.keys(val)
                    if (mode === 'insert') {
                        text += `(${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => `$${paramIndex++}`).join(', ')})`
                        params.push(...keys.map(k => val[k]))
                    } else {
                        text += keys.map(k => `"${k}"=$${paramIndex++}`).join(', ')
                        params.push(...keys.map(k => val[k]))
                    }
                }
            }
            // 普通对象
            else if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
                const keys = Object.keys(raw)
                if (mode === 'insert') {
                    text += `(${keys.map(k => `"${k}"`).join(', ')}) VALUES (${keys.map(() => `$${paramIndex++}`).join(', ')})`
                    params.push(...keys.map(k => raw[k]))
                } else {
                    text += keys.map(k => `"${k}"=$${paramIndex++}`).join(', ')
                    params.push(...keys.map(k => raw[k]))
                }
            }
            // 数组，比如in(...)
            else if (Array.isArray(raw)) {
                const placeholders = raw.map(() => `$${paramIndex++}`)
                text += `(${placeholders.join(', ')})`
                params.push(...raw)
            }
            // 基础值
            else {
                text += `$${paramIndex++}`
                params.push(raw)
            }
        }
    }

    return { text, params }
}

function pg(config: any) {
    if (!pg_pool) {
        pg_pool = new Pool(config)
        console.log('✅ PostgreSQL 连接池初始化完成')
    }

    function sql(strings: TemplateStringsArray | any, ...values: any[]) {
        // 如果不是模板字符串调用，则返回一个SQL片段（比如sql('user')）
        const isTemplate = Array.isArray(strings) && 'raw' in strings
        if (!isTemplate) {
            return { __sql: true, val: strings }
        }

        const { text, params } = compile(strings as TemplateStringsArray, values)
        const pool = ctx('tx') || pg_pool!

        const mode = getMode(text)
        const isExec = ['select', 'insert', 'update', 'delete'].includes(mode)

        if (isExec) {//立即执行
            // 执行SQL，返回查询结果数组
            console.log('🚀 SQL:', text)
            console.log('📦 Params:', params)
            return pool.query(text, params).then(res => res.rows)
        } else {
            // 只返回SQL片段对象，用于拼接，不执行
            return {
                __sql: true,
                raw: true,
                text,
                params,
            }
        }
    }

    sql.connect = () => {
        if (!pg_pool) throw new Error('连接池尚未初始化，请先调用 pg(config)')
        return pg_pool.connect()
    }

    return sql
}

// 事务装饰器
function tx(target: any, methodName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    descriptor.value = async function (...args: any[]) {
        if (!pg_pool) throw new Error('连接池未初始化，请先调用 pg(config)')
        const client = await pg_pool.connect()
        try {
            await client.query('BEGIN')
            let result
            await asyncLocalStorage.run({ tx: client }, async () => {
                result = await originalMethod.apply(this, args)
            })
            await client.query('COMMIT')
            return result
        } catch (err) {
            await client.query('ROLLBACK')
            console.log('回滚')
            throw err
        } finally {
            client.release()
        }
    }
}

// 初始化连接池
const sql = pg({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    host: '156.238.240.143',
    port: 5432,
})

// 测试示例
async function test() {
    // 生成条件片段，不会执行
    const where = sql`id > ${1} AND name = ${'张三'}`//等价sql(strings,...values)

    // 自动执行select，where作为片段嵌套拼接
    const rows = await sql`SELECT * FROM ${sql('user')} WHERE ${where}`

    console.log('查询结果:', rows)
/*
    // 插入数据自动执行insert
    const inserted = await sql`INSERT INTO ${sql('user')} ${{ name: '李四', age: 29 }}`
    console.log('插入结果:', inserted)

    // 更新数据自动执行update
    const updateSet = sql`age = ${30}`
    const updated = await sql`UPDATE ${sql('user')} SET ${updateSet} WHERE id = ${1}`
    console.log('更新结果:', updated)*/
}

test().catch(console.error)
