import * as ts from "typescript";
import path from "path";
import fs from "fs";

function parseAst(classString) {
    const sourceFile = ts.createSourceFile(
        'temp.ts',
        classString,
        ts.ScriptTarget.Latest,
        true
    );

    let name = '';
    let attr = [];
    let fns = [
        { name: 'add', static: '' },
        { name: 'del', static: '' },
        { name: 'update', static: '' },
        { name: 'get', static: '' },
        { name: 'gets', static: '' },
        { name: 'getById', static: '' },
        { name: 'updateById', static: '' },
        { name: 'delById', static: '' },
        { name: 'sync', static: '' },
        { name: 'page', static: '' },
        { name: 'getPage', static: '' }
    ];

    function visit(node) {
        if (ts.isClassDeclaration(node)) {
            name = node.name?.getText(sourceFile) || "<Anonymous Class>";

            node.members.forEach(member => {
                // 提取方法信息
                if (ts.isMethodDeclaration(member)) {
                    const methodName = member.name?.getText(sourceFile) || "<Anonymous Method>";
                    const isStatic = member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
                    fns.push({ name: methodName, static: isStatic ? 'static' : '' });
                }

                // 提取属性信息
                else if (ts.isPropertyDeclaration(member)) {
                    const propName = member.name.getText(sourceFile);
                    attr.push(propName);
                }
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return { name, attr, fns };
}



function rpc_proxy(mode) {
    return {
        name: 'proxy',
        async transform(code, id) {
            if (id.includes('/src/api') && id.includes('.ts')) {
                let {name, attr, fns} = parseAst(code)
                //console.log(name, attr, fns)
                let aa = null
                if (mode == 'adm') {
                    aa = fns.map(x => `${x.static} async ${x.name}(...args){
                    delete this.model
                    const data  = await post('/${name.toLowerCase()}/${x.name}',{...this,sel:this.sel,args:args});
                    Object.keys(this).forEach(key => key !== 'list' && key !== 'page' && delete this[key])
                    this.list = data?.list;
                    this.total = data?.total;
                    //可以对象克隆，或者转为对应对象
                    return Array.isArray(data) ? reactive(data.map(item => reactive(item))) : reactive(data);
              }`)
                } else {
                    aa = fns.map(x => `async ${x}(...args){
                    const response = await post(${name.toLowerCase()}/${x})
                return reactive(response);
              }`)
                }
                //User源代码被替换了
                code = `
                import { post } from '../core/request.ts';
                import {reactive,ref,onMounted,nextTick} from "vue";
                export class ${name} {
                                constructor() {
                                   return reactive(this)
                                }
                                ${attr.join(';')};
                                 static sel(...fields) {
                                   const instance = new this();
                                   instance.sel = fields.length > 0 ? fields : ['**'];
                                   instance.model=instance.constructor.name
                                 return reactive(instance);
                                } 
                                 sel(...fields) {
                                   //const instance = new this();
                                   this.sel = fields.length > 0 ? fields : ['**'];
                                   this.model=this.constructor.name
                                 return this;
                                } 
                                ${aa.join('\n')}
                            }
`
                code = code.replaceAll('_', '')
                //console.log('code:',code)
                return {
                    code: code,
                    map: null // 不生成sourcemap
                }
            }
        }
    }
}

function switchIndex(mode) {
    return {
        name: 'switchIndex',
        transform(code, id) {
            if (id.includes('main.ts') && mode == 'adm') {
                //是在编译期间修改ast语法树
                //动态切换vue和uniapp
                return {
                    //@ts-ignore
                    code: code.replaceAll(/\bApp\b/g, 'AppAdm'),
                    map: null //  不生成sourcemap
                }
            }
        }
    }
}

function dsltransform(mode) {
    return {
        name: 'dsl-transform',
        async transform(code, id) {
            if (!id.endsWith('.vue')) return
            if (!id.endsWith('user/gets.vue')) return

            const pattern = /User\.sel\s*\(([\s\S]*?)\)\s*\.get\s*`([\s\S]*?)`/g

            if (!pattern.test(code)) {
                console.log('No DSL User.sel(...) get`...` found, skip.')
                return
            }

            console.log('matched DSL in:', id)

            // 重置正则指针，捕获所有匹配
            pattern.lastIndex = 0
            const matches = [...code.matchAll(pattern)]

            let methodSnippets = ''
            let methodIndex = 0
            let transformedCode = code

            for (const match of matches) {
                const [fullMatch, selArgs, whereClause] = match
                const expr = fullMatch
                methodIndex += 1
                const methodName = `${path.basename(path.dirname(id))}${methodIndex}`

                const paramPattern = /\$\{(\w+)\}/g
                const paramSet = new Set()
                let paramMatch
                while ((paramMatch = paramPattern.exec(whereClause))) {
                    const param = paramMatch[1]
                    // 只添加合法变量名（不能是纯数字）
                    if (!/^\d+$/.test(param)) {
                        paramSet.add(param)
                    }
                }
                const paramList = [...paramSet].join(', ')
                const methodCode = `
  async ${methodName}(${paramList}) {
    return await User.sel(${selArgs}).get\`${whereClause}\`
  }
`
                methodSnippets += methodCode
                transformedCode = transformedCode.replace(expr, `new User().${methodName}(${paramList})`)
            }

            // 写入后端方法
                const backendFile = path.resolve(__dirname, '../api/User.ts')
             let clazz = fs.readFileSync(backendFile, 'utf-8')
            const methodRegex = new RegExp(`async\\s+${path.basename(path.dirname(id))}${methodIndex}\\s*\\(`)
            if (!methodRegex.test(clazz)) {
                clazz = clazz.replace(/}\s*$/, methodSnippets + '\n}')
                 fs.writeFileSync(backendFile, clazz, 'utf-8')
            }
            return {
                code: transformedCode,
                map: null
            }
        }
    }
}

export {switchIndex, rpc_proxy,dsltransform}
