import {controllers, ctx} from '../core/oapi';
import path from 'path';
import fs from 'fs/promises';
import jwt from "jsonwebtoken";
import {getsql, PgBase} from "../core/PgBase.ts";
import sql from "../test/postgres.ts";
export class Obj extends PgBase{
    name:string
    menu:{}
    attr:[]
    async gets() {
        console.log(this.types)
        return Object.keys(controllers).map((x,i)=>{return {id:i+1,name:x}})
    }
    async migrate() {
        const baseTypeMap: Record<string, string> = {
            string: 'VARCHAR',
            number: 'INTEGER',
            boolean: 'BOOLEAN',
            Date: 'TIMESTAMP',
            bigint: 'BIGINT',
            any: 'JSONB',
            '[]': 'JSONB',
        };
        console.log(controllers)
        const createdTables = new Set<string>();
        const joinTables = new Set<string>();
        const pendingFK: Record<string, string[]> = {}; // 表名 => 外键列语句
        const sqls: string[] = [];

        for (let [name, ctrl] of Object.entries(controllers)) {
            if (name === 'obj') continue;
            const model = ctrl.prototype ?? ctrl;
            await ctrl.migratePage()
            name=model.constructor.name
            const types = model.constructor.types;
            if (!types) continue;

            const tableName = name.toLowerCase();
            if (createdTables.has(tableName)) continue;
            createdTables.add(tableName);

            const columns = [`id SERIAL PRIMARY KEY`];

            for (const [field, type] of Object.entries(types)) {
                if (type.endsWith('[]')) {
                    const relatedType = type.slice(0, -2);
                    const relatedCtrl = controllers[relatedType.toLowerCase()];
                    if (relatedCtrl) {
                        const relatedModel = relatedCtrl.prototype ?? relatedCtrl;
                        const relatedTypes = relatedModel.constructor.types ?? {};
                        const isManyToMany = Object.values(relatedTypes).includes(`${name}[]`);

                        const a = tableName;
                        const b = relatedType.toLowerCase();

                        if (isManyToMany) {
                            // 多对多：生成中间表
                            const join = [a, b].sort().join('_');
                            if (!joinTables.has(join)) {
                                joinTables.add(join);
                                sqls.push(`
CREATE TABLE IF NOT EXISTS ${join} (
  ${a}_id INTEGER,
  ${b}_id INTEGER,
  PRIMARY KEY (${a}_id, ${b}_id)
);`.trim());
                            }
                        } else {
                            // 一对多：反方向模型表加外键
                            const fk = `${a}_id INTEGER REFERENCES ${a}(id) ON DELETE CASCADE`;
                            if (!pendingFK[b]) pendingFK[b] = [];
                            pendingFK[b].push(`${field}_index INTEGER, ${fk}`); // 可以再处理字段名
                        }
                    } else {
                        // 非模型数组，如 string[], any[] → 存 JSONB
                        columns.push(`${field} JSONB`);
                    }
                } else if (controllers[type]) {
                    // 一对一或多：字段名_id
                    const fkTable = type.toLowerCase();
                    columns.push(`${field}_id INTEGER REFERENCES ${fkTable}(id)`);
                } else {
                    const pgType = baseTypeMap[type] || 'TEXT';
                    columns.push(`${field} ${pgType}`);
                }
            }
            columns.push(
                `is_deleted BOOLEAN DEFAULT FALSE`,
                `created_at TIMESTAMPTZ DEFAULT NOW()`,
                `updated_at TIMESTAMPTZ DEFAULT NOW()`)
            const createTableSql = `
CREATE TABLE IF NOT EXISTS "${tableName}" (
  ${columns.join(',\n  ')}
);`.trim();
            sqls.push(createTableSql);
        }

        // 加上反向一对多的外键字段
/*        for (const [table, fks] of Object.entries(pendingFK)) {
            sqls.push(`-- Auto FK fields on ${table}`);
            sqls.push(`
ALTER TABLE ${table}
  ADD COLUMN IF NOT EXISTS ${fks.join(',\n  ADD COLUMN IF NOT EXISTS ')}
;`.trim());
        }*/
        let pool=getsql()
        for (const sql of sqls) {
            console.log('sql:',sql)
            await pool.query(sql); // 按顺序执行每条 SQL
        }
        return sqls;
    }

    async add() {
        const className = this.name;
        const fileName = `${className}.ts`;
        const filePath = path.resolve('./src/api', fileName); // 可根据你的项目结构调整
        // 构建属性字符串
        const props = this.attr.map(a =>{
            a[`${a.input}`]=a.source
            let {input,source,key,type,...rest}=a
            return`    @prop(${JSON.stringify(rest)})
    ${key}: ${type};`
        }).join('\n');
        // 构建 class 内容
        const content = `import {PgBase,prop,menu} from "../core/PgBase.ts"
@menu(${JSON.stringify(this.menu)})        
export class ${className} extends PgBase{
${props}
}`
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ 类文件已生成: ${filePath}`);
        let m=await import(`./${fileName}`)
        console.log(m)
        //m[className].migratePage()
        //调用migrate，生成gets页面，渲染多列表格，渲染多个表单item
        return 'OK';
    }
}
