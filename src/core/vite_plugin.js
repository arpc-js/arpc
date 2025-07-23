import * as ts from "typescript";
import path from "path";
import fs from "fs";
const basicTypes = ['string', 'number', 'boolean', 'bigint', 'any', 'Date'];
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
        { name: 'cover', static: '' },
        { name: 'page', static: '' },
        { name: 'getPage', static: '' },
        { name: 'reset', static: '' }
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
                    let propName = member.name.getText(sourceFile);
                    let typeStr = member.type.getText(sourceFile);
                    if (typeStr.endsWith('[]')) {
                        propName+= '=[]'; // 是数组
                    } else if (!basicTypes.includes(typeStr)) {
                        propName+= '={}'; // 非基本类型视为对象（Role, Permission 等）
                    }
                    attr.push(propName);
                }
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return { name, attr, fns };
}



function arpc_cli({rpc_dir,base_url,mode,interceptor,vue_login='',uni_login=''}) {
    return {
        name: 'proxy',
        enforce: 'pre',
        async transform(code, id) {
            if (id.includes(rpc_dir) && id.includes('.ts')) {
                let {name, attr, fns} = parseAst(code)

                // interceptorFn 要么是函数，要么是函数字符串
                // 转成字符串，方便内联
                let interceptorStr = typeof interceptor === 'function' ? interceptor.toString() : interceptor;

                let aa = fns.map(x => `
                @interceptor
                ${x.static} async ${x.name}(...args){
                    let {list,total,...rest} = this;
                    const data = await post('${mode}', this, '/${name.toLowerCase()}/${x.name}', {...rest, sel:this.sel, args:args});
                    return Array.isArray(data) ? reactive(data.map(item => reactive(item))) : reactive(data);
                }`)

                code = `
                import { post,initReq } from '../core/request.ts';
                import { deepClear } from '../core/utils.js';
                import { reactive, ref, onMounted, nextTick } from "vue";
                // 内联拦截器函数
                const interceptor = ${interceptorStr};

                export class ${name} {
                    constructor() {
                        initReq({base_url:'${base_url}',vue_login:'${vue_login}',uni_login:'${uni_login}'})
                        return reactive(this)
                    }
                    ${attr.join(';')};
                    static sel(...fields) {
                        const instance = new this();
                        instance.sel = fields.length > 0 ? fields : ['**'];
                        instance.model = instance.constructor.name;
                        return reactive(instance);
                    }
                    sel(...fields) {
                        this.sel = fields.length > 0 ? fields : ['**'];
                        this.model = this.constructor.name;
                        return this;
                    }
                    ${aa.join('\n')}
                }
                `
                return {
                    code,
                    map: null
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
    let lastWriteTime = 0;
    const WRITE_INTERVAL = 2000; // 2秒节流，限制写文件频率
    return {
        name: 'dsl-transform',
        enforce: 'pre',
        async transform(code, id) {
            if (!id.endsWith('.vue')) return;
            console.log(id)
            const pattern = /(\w+)\.sel\s*\(([\s\S]*?)\)\s*\.get\s*`([\s\S]*?)`/g;

            if (!pattern.test(code)) {
                console.log('No DSL sel(...) get`...` found, skip.');
                return;
            }

            pattern.lastIndex = 0;
            const matches = [...code.matchAll(pattern)];

            let transformedCode = code;
            const methodIndexMap = {};
            const generatedMethods = {};
            const methodNames = new Set();

            for (const match of matches) {
                const [fullMatch, caller, selArgs, whereClause] = match;

                if (!methodIndexMap[caller]) methodIndexMap[caller] = 1;
                const index = methodIndexMap[caller]++;
                const dirName = path.basename(path.dirname(id));
                const methodName = `${dirName}_vue_${index}`;

                // 提取 DSL 中的变量名
                const paramPattern = /\$\{(\w+)\}/g;
                const paramSet = new Set();
                let paramMatch;
                while ((paramMatch = paramPattern.exec(whereClause))) {
                    const param = paramMatch[1];
                    if (!/^\d+$/.test(param)) {
                        paramSet.add(param);
                    }
                }
                const paramList = [...paramSet].join(', ');

                if (methodNames.has(methodName)) continue;
                methodNames.add(methodName);

                // 生成方法代码
                let methodCode = `
  async ${methodName}(${paramList}) {
    return await ${caller}.sel(${selArgs}).get\`${whereClause}\`
  }
`;

                // 提取要 import 的模型名
                const importModels = new Set();
                const modelPattern = /\b([A-Z][a-zA-Z0-9_]*)\.sel\s*\(/g;
                let modelMatch;
                while ((modelMatch = modelPattern.exec(selArgs))) {
                    const model = modelMatch[1];
                    if (model !== caller) importModels.add(model);
                }
                console.log('importModels', importModels);

                // 存储生成的方法
                if (!generatedMethods[caller]) generatedMethods[caller] = [];
                generatedMethods[caller].push({ methodName, methodCode, importModels });

                // 替换代码中对应的调用为实例方法调用
                transformedCode = transformedCode.replace(
                    fullMatch,
                    `new ${caller}().${methodName}(${paramList})`
                );
            }

            // 批量写入后端文件，限制写入频率避免无限热更新
            for (const caller in generatedMethods) {
                const backendFile = path.resolve(__dirname, `../arpc/${caller}.ts`);

                let clazz = '';
                if (fs.existsSync(backendFile)) {
                    clazz = fs.readFileSync(backendFile, 'utf-8');
                }

                // 已有的 import
                const importRegex = /^import\s+{\s*(\w+)\s*}\s+from\s+['"][^'"]+['"]/gm;
                const existingImports = new Set();
                let match;
                while ((match = importRegex.exec(clazz))) {
                    existingImports.add(match[1]);
                }

                // 需要新增的 import
                const toImport = new Set();
                for (const { importModels } of generatedMethods[caller]) {
                    for (const model of importModels) {
                        if (model !== caller && !existingImports.has(model)) {
                            toImport.add(model);
                        }
                    }
                }

                // 插入 import，放文件开头
                if (toImport.size > 0) {
                    const importLines =
                        [...toImport].map(m => `import { ${m} } from './${m}'`).join('\n') + '\n';
                    clazz = importLines + clazz;
                }

                // 插入或替换方法
                for (const { methodName, methodCode } of generatedMethods[caller]) {
                    const methodRegex = new RegExp(`async\\s+${methodName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?}\\s*`, 'g');
                    if (methodRegex.test(clazz)) {
                        // 替换已有方法体
                        clazz = clazz.replace(methodRegex, methodCode + '\n').replaceAll(`
\`
  }`,'');
                    } else {
                        // 追加方法，替换文件结尾的 '}'
                        clazz = clazz.replace(/}\s*$/, methodCode + '\n}');
                    }
                }

                const oldContent = fs.existsSync(backendFile) ? fs.readFileSync(backendFile, 'utf-8') : '';

                const now = Date.now();
                if (now - lastWriteTime > WRITE_INTERVAL) {
                    if (oldContent !== clazz) {
                        fs.writeFileSync(backendFile, clazz, 'utf-8');
                        lastWriteTime = now;
                        console.log(`[dsl-transform] updated backend file: ${backendFile}`);
                    }
                }
            }

            return {
                code: transformedCode,
                map: null,
            };
        },
    };
}
export {switchIndex, arpc_cli,dsltransform}
