// 示例JSON对象（可替换为实际数据结构）
const nestedJson = {
    id: 1,
    name: "root",
    children: [
        {
            id: 2,
            name: "child-1",
            data: { value: 100 },
            items: ["a", "b"]
        },
        {
            id: 3,
            name: "child-2",
            children: [
                { id: 4, value: true }
            ]
        }
    ]
};

// 处理数组类型
function recursiveTraversal(data) {
    if (Array.isArray(data))  {       // 处理数组类型
        data.forEach(item  => recursiveTraversal(item));
    } else if (typeof data === 'object') {  // 处理对象类型
        for (let key in data) {
            if (typeof data[key]=='object')  {
                console.log(`Key:  ${key}, Value: ${data[key]}`);
                //插入父表，返回父id
                //递归插入子表
                recursiveTraversal(data[key]);    // 递归处理嵌套属性
            }
        }
    }
}
recursiveTraversal(nestedJson)
