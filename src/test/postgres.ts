// pgClient.js
import { Pool } from 'pg'

// 创建连接池
const pool = new Pool({
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
    host: '156.238.240.143',
    port: 5432,
})

/**
 * 标签模板函数：可直接 await sql`...`
 */
function tagToPrepareStatement(strings,values) {
    let text = ''
    const params = []
    let paramIndex = 1
    for (let i = 0; i < strings.length; i++) {
        text += strings[i]
        if (i < values.length) {
            const val = values[i]
            if (val && val.__raw) {
                text += val.text
            } else {
                text += `$${paramIndex++}`
                params.push(val)
            }
        }
    }
    return {statement:text,args:params}
}
function sql(strings, ...values) {
    const isTemplate = isTaggedTemplateCall(strings)
    if (!isTemplate) {
        return { __raw: true, text: strings }
    } else {
        let {statement,args}=tagToPrepareStatement(strings, values)
        // 手动返回 Promise（不要用 await）
        return pool.query(statement, args)
    }
}

function isTaggedTemplateCall(strings) {
    return (
        Array.isArray(strings) &&
        typeof strings.raw === 'object' &&
        strings.raw.length === strings.length
    )
}
// insert(table, obj)
sql.insert = async function (table, obj) {
    const keys = Object.keys(obj)
    const cols = keys.map(k => `"${k}"`).join(', ')
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(obj)

    const text = `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`
    const res = await pool.query(text, values)
    return res.rows
}

// update(table, obj, where)
sql.update = async function (table, updates, where = {}) {
    const setKeys = Object.keys(updates)
    const setClause = setKeys.map((k, i) => `"${k}" = $${i + 1}`).join(', ')
    const setValues = Object.values(updates)

    const whereKeys = Object.keys(where)
    const whereClause = whereKeys.map((k, i) => `"${k}" = $${i + 1 + setKeys.length}`).join(' AND ')
    const whereValues = Object.values(where)

    const text = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause} RETURNING *`
    const res = await pool.query(text, [...setValues, ...whereValues])
    return res.rows
}

export default sql

let id=1
let table='"user"'
const col = ['"user".id as user_id', '"user".name','"role_user".role_id as role_id'] // 注意：加表名前缀，不加引号
let join=[]
let where='WHERE "user".id = ${id}'
const { rows } = await sql`
    SELECT ${sql('"user".id as user_id,"user".name')}
    FROM ${sql(table)}
    left join ${sql('"role_user" on "user".id="role_user".user_id')}
    ${sql(where)}
`
console.log(rows)

