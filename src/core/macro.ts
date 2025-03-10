import fs from 'fs';
import {User} from "../api/User.ts";
let routeMap={}
function getType1() {
    let code=fs.readFileSync(`src/api/User.ts`, 'utf8')
    const regex = /^\s*([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)\s*(?=\n|;|$)/gm;

// 提取所有匹配项
    const matches = Array.from(code.matchAll(regex));

// 转换为属性数组
    const properties = matches.map(match => ({
        name: match[1],
        type: match[2]
    }));

    console.log(properties);
    return properties
}
function getType() {
     //包扫描
     //递归解析每个文件抽象语法树ast
     //每个key是哪个类型
     //递归设置每个原型链的meta元数据
     let code=fs.readFileSync(`src/api/User.ts`, 'utf8')
     const regex = /order\s*:\s*([A-Za-z_$][\w$]*)/;
     const orderType = code.match(regex)?.[1]
     //动态导入原型链
     //let cla=Object.values(await import('../api/User.ts'))[0]
     Object.defineProperty(User['prototype'], 'meta', {
         value: {orderType:'Order'}, // 创建一个新的 metadata 对象
         writable: true,
         enumerable: false, // 不让 metadata 枚举，保持类结构干净
         configurable: true
     });
      routeMap['/test/test'] = (req: Request) => {
        return new Response(req.url+'11111111111');
    }

}
//类型宏
//遍历ast语法树，返回类型
export {getType,routeMap,getType1}
