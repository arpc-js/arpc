import {controllers} from '../core/Arpc.ts';
import path from 'path';
import fs from 'fs/promises';
import {getsql, dbType} from "../core/ArBase.ts";
import { existsSync } from 'fs';
export class Obj{
    name:string
    menu:{}
    attr:[]
    async gets() {
        return Object.keys(controllers).map((x, i) => {
            const Cls = controllers[x];
            const inst = new Cls();
            const props = Cls.props || {}; // 你的结构是 object 而不是 array
            const attr = Object.keys(props).map(key => {
                const p = props[key];

                // 自动识别 input 类型和 source 来源
                const inputTypes = ['sel', 'boolean', 'Date', 'any'];
                const input = inputTypes.find(t => p[t] !== undefined) || 'input';
                const source = p[input] ?? '';

                return {
                    key: key,
                    tag: p.tag || '',
                    type: p.type || 'string',
                    input,
                    source,
                    filter: p.filter || '',
                    hide: p.hide || [],
                };
            });

            return {
                id: i + 1,
                name: Cls.name,
                path: inst.path || '',
                menu: Cls.menu || { name: '', parent: '' },
                attr
            };
        });
    }
    async getTypes() {
        const keys = Object.keys(controllers);
        const result =['string', 'bigint','number', 'boolean', 'Date', 'any','[]'];
        for (const key of keys) {
            const className = key.charAt(0).toUpperCase() + key.slice(1);
            result.push(className);
            result.push(`${className}[]`);
        }
        return result;
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
            await this.migratePage(ctrl)
            name=model.constructor.name
            const types = model.constructor.types;
            if (!types) continue;

            const tableName = name.toLowerCase();
            if (createdTables.has(tableName)) continue;
            createdTables.add(tableName);

            const columns = [
                dbType === 'mysql'
                    ? 'id INT PRIMARY KEY AUTO_INCREMENT'
                    : 'id SERIAL PRIMARY KEY'
            ];

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
            let timestamp=dbType=='mysql'?'TIMESTAMP DEFAULT CURRENT_TIMESTAMP':'TIMESTAMPTZ DEFAULT NOW()'
            columns.push(
                `is_deleted BOOLEAN DEFAULT FALSE`,
                `created_at ${timestamp}`,
                `updated_at ${timestamp}`)
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
    async migratePage(ctrl) {
        const formItems: string[] = []
        const tableColumns: string[] = []
        const toolbarItems: string[] = []

        //@ts-ignore
        for (const key in ctrl.props) {
            let type=ctrl.types[key]
            console.log('typetypetype',ctrl)
            console.log('typetypetype',type)
            let subClass=controllers[type.toLowerCase().replaceAll('[]','')]
            //@ts-ignore
            const col = ctrl.props[key]
            const label = col.tag || key
            const model = `obj.${key}`

            if (col.sel && typeof col.sel === 'string') {
                col.sel = col.sel.split(' ')
            }

            // ===== ✅ 生成筛选区 toolbar =====
            if (col.filter && !col.hide?.includes('gets')) {
                if (col.sel) {
                    const options = col.sel.map((val: any) =>
                        `<el-option label="${val}" value="${val}" />`
                    ).join('\n        ')
                    toolbarItems.push(`
      <el-form-item label="${label}">
        <el-select v-model="${model}" value-key="id" clearable placeholder="请选择${label}">
          ${options}
        </el-select>
      </el-form-item>`)
                } else {
                    toolbarItems.push(`
      <el-form-item label="${label}">
        <el-input v-model="${model}" placeholder="请输入${label}" clearable />
      </el-form-item>`)
                }
            }

            // ===== ✅ 生成表单 form =====
            if (!col.hide?.includes('add')) {
                if (subClass&&type.includes('[]')) {
                    const tableColumns = Object.entries(subClass.props)
                        .map(([subKey, { tag: subTag }]) => `
      <el-table-column label="${subTag}" prop="${subKey}">
        <template #default="scope">
          <el-input v-model="scope.row.${subKey}" placeholder="请输入" />
        </template>
      </el-table-column>`)
                        .join('\n');

                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-table :data="obj.${key}" style="width: 100%">
      ${tableColumns}
      <el-table-column align="right">
      <template #header>
        <el-button size="small" @click="obj.${key}.push({})">新增</el-button>
      </template>
      <template #default="scope">
        <el-button
            size="small"
            type="danger"
            @click="obj.${key}.splice(scope.$index, 1)"
        >
          Delete
        </el-button>
      </template>
    </el-table-column>
    </el-table>
  </el-form-item>`);
                }else if (subClass) {
                    const objectFields = Object.entries(subClass.props)
                        .map(([subKey, { tag: subTag }]) => `
      <el-input v-model="obj.${key}.${subKey}" placeholder="请输入${subTag}" />
      `)
                        .join('\n');

                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <div>
      ${objectFields}
    </div>
  </el-form-item>`);
                } else if (col.sel||col.msel||col.radio) {
                    const multiple = col.msel!=undefined
                    const isRadio = col.radio !=undefined
                    let options = (col.sel||col.msel||col.radio).map((val: any) =>
                        isRadio
                            ? `<el-radio label="${val}">${val}</el-radio>`
                            : `<el-option label="${val}" value="${val}" />`
                    ).join('\n        ')
                    if (!options) {
                        options = `<el-option v-for="item in ${model}" :key="item.id" :label="item.name" :value="item" />`
                    }

                    if (isRadio) {
                        formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-radio-group v-model="${model}">
      ${options}
    </el-radio-group>
  </el-form-item>`)
                    } else {
                        formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-select v-model="${model}" ${multiple ? 'multiple' : ''}>
      ${options}
    </el-select>
  </el-form-item>`)
                    }
                } else if (col.checkbox) {
                    const options = col.msel.map((val: any) =>
                        `<el-checkbox label="${val}">${val}</el-checkbox>`
                    ).join('\n        ')
                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-checkbox-group v-model="${model}">
      ${options}
    </el-checkbox-group>
  </el-form-item>`)
                } else if (col.type === 'date') {
                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-date-picker v-model="${model}" type="date" />
  </el-form-item>`)
                } else if (col.type === 'textarea') {
                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-input type="textarea" v-model="${model}" />
  </el-form-item>`)
                } else if (col.type === 'number'||col.type === 'bigint') {
                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-input-number v-model="${model}" />
  </el-form-item>`)
                } else if (col.type === 'switch') {
                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-switch v-model="${model}" />
  </el-form-item>`)
                } else {
                    formItems.push(`
  <el-form-item label="${label}" prop="${key}">
    <el-input v-model="${model}" />
  </el-form-item>`)
                }
            }

            // ===== ✅ 生成表格列 =====
            if (!col.hide?.includes('gets')) {
                tableColumns.push(`  <el-table-column prop="${key}" label="${label}" />`)
            }
        }

        // 操作列
        tableColumns.push(`
  <el-table-column label="操作" width="240">
    <template #header>
      <el-button size="small" @click="openDialog('add')">新增</el-button>
    </template>
    <template #default="scope">
      <el-button size="small" @click="openDialog('detail', scope.row)">详情</el-button>
      <el-button size="small" @click="openDialog('edit', scope.row)">修改</el-button>
      <el-button size="small" type="danger" @click="obj.del(scope.row.id)">删除</el-button>
    </template>
  </el-table-column>`.trim())

        // ===== ✅ 渲染区域拼接 =====
        const table = `<el-table :data="obj.list" style="width: 100%">\n${tableColumns.join('\n')}\n</el-table>`
        const form = `<el-form :model="obj">\n${formItems.join('\n')}\n</el-form>`
        const toolbar = `
<div class="toolbar">
  <el-form :inline="true" class="filter-form">
    ${toolbarItems.join('\n')}
    <el-form-item>
      <el-button type="primary" @click="obj.getPage()">查询</el-button>
    </el-form-item>
  </el-form>
</div>`.trim()

        let template = temp
            .replaceAll('--table--', table)
            .replaceAll('--form--', form)
            .replaceAll('--toolbar--', toolbar)
            .replaceAll('clazzPlaceHolder', ctrl.name)

        if (existsSync(`src/views/${ctrl.name.toLowerCase()}`)) {
            // 文件不存在，直接返回或处理
            return;
        }
        await fs.mkdir(`src/views/${ctrl.name.toLowerCase()}`, { recursive: true })
        await fs.writeFile(`src/views/${ctrl.name.toLowerCase()}/gets.vue`, template)

        return { table, form, toolbar }
    }
    async add() {
        const className = this.name;
        const fileName = `${className}.ts`;
        const filePath = path.resolve('./src/arpc', fileName); // 可根据你的项目结构调整
        // 构建属性字符串
        const baseTypes = ['bigint','string', 'number', 'boolean', 'any', 'unknown', 'Date','{}','[]']
        let imports=[]
        const props = this.attr.map(a =>{
            a[`${a.input}`]=a.source
            let {input,source,key,type,...rest}=a
            //若type不是基本类型和{},[]等类型要导包imports.push(import  {type} from "./type.ts")
            if (!baseTypes.includes(type)) {
                let rawType=type.replaceAll('[]','').replaceAll(' ','')
                imports.push(`import { ${rawType} } from "./${rawType}.ts"`)
            }
            return`    @prop(${JSON.stringify(rest)})
    ${key}: ${type};`
        }).join('\n');
        // 构建 class 内容
        const content = `import {ArBase,prop,menu} from "../core/ArBase.ts"
${imports.join('\n')}
@menu(${JSON.stringify(this.menu)})        
export class ${className} extends ArBase{
${props}
}`
        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`✅ 类文件已生成: ${filePath}`);
        let m=await import(`./${fileName}`)
        console.log(m)
        let cla=m[className]
        let types={}
        this.attr.forEach(a => {
            types[a.key] = a.type
        })
        cla.types=types
        controllers[className.toLowerCase()]=cla
        console.log(controllers)
        //m[className].migratePage()
        //调用migrate，生成gets页面，渲染多列表格，渲染多个表单item
        return 'OK';
    }
}
//@ts-ignore
let temp = `
<template>
  <el-card>
    <!-- 筛选区域 -->
    --toolbar--
    <!-- 表格区域 -->
    --table--
    <!-- 弹窗：新增/修改/详情 -->
    <el-dialog :title="dialogTitle" v-model="showDialog" width="1000px" @close="obj.reset()">
    --form--
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
        <el-button type="primary" v-if="dialogMode !== 'detail'" @click="obj.sync().then(() => showDialog = false)">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
  <el-pagination v-model:current-page="obj.page" v-model:page-size="obj.size" :total="obj.total" @current-change="obj.getPage()" background layout="total,prev, pager, next"  />
</template>

<script lang="ts" setup>
import { ref,onMounted } from 'vue';

import {clazzPlaceHolder} from "../../arpc/clazzPlaceHolder.ts";
let obj=new clazzPlaceHolder()
obj.getPage()
onMounted(async () => {
  console.log('页面加载完成，执行函数')
})
const showDialog = ref(false);
const dialogMode = ref<'add' | 'edit' | 'detail'>('add')
const dialogTitle = ref('')
//@ts-ignore
function openDialog(mode, row) {
  dialogMode.value = mode;
  dialogTitle.value = mode === 'add' ? '新增' : mode === 'edit' ? '修改' : '查看详情';
  if (row) {
    Object.assign(obj, row)
  } else {
    Object.assign(obj, {})
  }
  showDialog.value = true;
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
`
