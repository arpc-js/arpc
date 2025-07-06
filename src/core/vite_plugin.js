import * as ts from "typescript";
function parseAst(classString) {
    const sourceFile = ts.createSourceFile(
        'temp.ts',
        classString,
        ts.ScriptTarget.Latest,
        true
    );
    let name=''
    let attr=[]
    let fns=[
        'add','del','update','get','gets',
        'getById','updateById','delById',
        'sync','page','getPage'
    ]
    function visit(node) {
        if (ts.isClassDeclaration(node)) {
             name = node.name?.getText(sourceFile) || "<Anonymous Class>";
            node.members.forEach(member => {
                // 提取方法信息（原有逻辑）
                if (ts.isMethodDeclaration(member)) {
                    const methodName = member.name?.getText(sourceFile) || "<Anonymous Method>";
                    fns.push(methodName)
                    member.parameters.forEach((param, index) => {
                        const paramName = param.name.getText(sourceFile);
                        const paramType = param.type?.getText(sourceFile) || "any";
                        const isOptional = param.questionToken ? "?" : "";
                    });
                }

                // 新增：提取属性信息
                else if (ts.isPropertyDeclaration(member)) { // [!code ++]
                    const propName = member.name.getText(sourceFile); // [!code ++]
                    attr.push(propName)
                    // 获取类型（如未显式声明类型则为 any） // [!code ++]
                    const propType = member.type?.getText(sourceFile) || "any"; // [!code ++]
                    // 获取修饰符（public/private/readonly 等） // [!code ++]
                    const modifiers = member.modifiers?.map(mod => mod.getText(sourceFile)).join(' ') || ''; // [!code ++]
                    // 判断是否可选 // [!code ++]
                    const isOptional = member.questionToken ? "?" : ""; // [!code ++]
                }
            });
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return {name,attr,fns}
}
function rpc_proxy(mode) {
    return {
        name: 'proxy',
        async transform(code, id) {
            if (id.includes('/src/api')&&id.includes('.ts')) {
                let {name,attr,fns}=parseAst( code)
                console.log(name,attr,fns)
                let aa=null
                if (mode=='adm'){
                    aa=fns.map(x=>`async ${x}(...args){
                    delete this.model
                    const data  = await post('/${name.toLowerCase()}/${x}',{...this,sel:this.sel,args:args});
                    Object.keys(this).forEach(key => key !== 'list' && key !== 'page' && delete this[key])
                    this.list = data?.list;
                    this.total = data?.total;
                    //可以对象克隆，或者转为对应对象
                    return Array.isArray(data) ? reactive(data.map(item => reactive(item))) : reactive(data);
              }`)
                }else {
                    aa=fns.map(x=>`async ${x}(...args){
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
                code=code.replaceAll('_','')
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
            if (id.includes('main.ts')&&mode=='adm'){
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
export {switchIndex,rpc_proxy}
