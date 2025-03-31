// start.ts
import { plugin } from "bun";
import * as ts from "typescript";
let meta={}
function extractClassInfo(sourceFile,meta) {
    function visit(node) {
        if (ts.isClassDeclaration(node)) {
            const className = node.name?.getText(sourceFile) || "<Anonymous Class>";
            node.members.forEach(member => {
                // 提取方法信息（原有逻辑）
                if (ts.isMethodDeclaration(member)) {
                    const methodName = member.name?.getText(sourceFile) || "<Anonymous Method>";
                    member.parameters.forEach((param, index) => {
                        const paramName = param.name.getText(sourceFile);
                        const paramType = param.type?.getText(sourceFile) || "any";
                        const isOptional = param.questionToken ? "?" : "";
                    });
                }

                // 新增：提取属性信息
                else if (ts.isPropertyDeclaration(member)) { // [!code ++]
                    const propName = member.name.getText(sourceFile); // [!code ++]
                    // 获取类型（如未显式声明类型则为 any） // [!code ++]
                    const propType = member.type?.getText(sourceFile) || "any"; // [!code ++]
                    // 获取修饰符（public/private/readonly 等） // [!code ++]
                    const modifiers = member.modifiers?.map(mod => mod.getText(sourceFile)).join(' ') || ''; // [!code ++]
                    // 判断是否可选 // [!code ++]
                    const isOptional = member.questionToken ? "?" : ""; // [!code ++]
                    meta[propName]=propType
                }
            });
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
}
const prototypeMetaTransformer = (context) => {
    const visitor = (node: ts.Node): ts.Node => {
        if (ts.isClassDeclaration(node)) {
            // 创建 static meta = {} 属性节点
            const staticMetaProperty = ts.factory.createPropertyDeclaration(
                [ts.factory.createModifier(ts.SyntaxKind.StaticKeyword)], // static 修饰符
                'meta',                                                     // 属性名
                undefined,                                                  // 可选标记（如 ?）
                undefined,                                                  // 类型注解（无需指定）
                ts.factory.createIdentifier(`${JSON.stringify(meta)}`)                  // 初始值 = {}
            );

            // 将 static meta 插入到类成员数组的第一行
            const updatedMembers = [
                staticMetaProperty,
                ...node.members // 保留原有成员
            ];

            // 更新类声明节点
            return ts.factory.updateClassDeclaration(
                node,
                node.modifiers,    // 保留原有修饰符（如 export）
                node.name,         // 类名
                node.typeParameters,
                node.heritageClauses,
                updatedMembers     // 更新后的成员数组
            );
        }
        return ts.visitEachChild(node, visitor, context);
    };

    return (sf: ts.SourceFile) => ts.visitNode(sf, visitor);
};
// 注册插件（在运行时拦截文件加载）
let meta_plugin={
    name: "Custom loader",
    async setup(build) {
        // 处理所有 .ts 文件
        build.onLoad({ filter: /\api.*.ts$/ }, async ({ path }) => {
            let classString = await Bun.file(path).text()
            //字符串创建ts源文件
            const sourceFile = ts.createSourceFile(
                'temp.ts',
                classString,
                ts.ScriptTarget.Latest,
                true
            );
            extractClassInfo(sourceFile,meta);
            const transformResult =ts.transform(sourceFile, [prototypeMetaTransformer]);
            const transformedSource = transformResult.transformed[0];
            classString=ts.createPrinter().printFile(transformedSource as ts.SourceFile)
            const compilerOptions: ts.CompilerOptions = {
                target: ts.ScriptTarget.ESNext,          // 保留最新语法（不降级）
                module: ts.ModuleKind.ESNext,            // 保留ES模块语法
                removeComments: false,                   // 保留注释
                experimentalDecorators: true,            // 保留装饰器语法
                emitDecoratorMetadata: true,             // 保留装饰器元数据
            };
            //类型擦除
            const result = ts.transpileModule(classString, { compilerOptions });
            console.log( result.outputText)
            meta={}
            return { contents: result.outputText, loader: "ts" };
        });
    },
}
export {meta_plugin}
