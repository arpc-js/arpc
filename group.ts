const rawData = [
    { id: 'M1', name: 'm1name', sub_id: 1, item: '子项A', value: 10, spu_id: 1, spu_name: 'test1' },
    { id: 'M1', name: 'm1name', sub_id: 1, item: '子项A', value: 10, spu_id: 2, spu_name: 'test2' },
    { id: 'M1', name: 'm1name', sub_id: 2, item: '子项B', value: 10, spu_id: 3, spu_name: 'test3' },
    { id: 'M1', name: 'm1name', sub_id: 2, item: '子项B', value: 10, spu_id: 4, spu_name: 'test4' }
];

// 聚合函数
function aggregateData(data) {
    const resultMap = {};

    data.forEach(item => {
        const { id, name, sub_id, item: subItemName, value, spu_id, spu_name } = item;

        // 初始化主项
        if (!resultMap[id]) {
            resultMap[id] = {
                id,
                name,
                subItems: {}
            };
        }

        const mainItem = resultMap[id];

        // 初始化子项
        if (!mainItem.subItems[sub_id]) {
            mainItem.subItems[sub_id] = {
                sub_id,
                item: subItemName,
                value,
                spus: []
            };
        }

        // 添加 SPU
        mainItem.subItems[sub_id].spus.push({
            spu_id,
            spu_name
        });
    });

    // 转换为最终结构
    return Object.values(resultMap).map(mainItem => ({
        //@ts-ignore
        ...mainItem,
        //@ts-ignore
        subItems: Object.values(mainItem.subItems)
    }));
}

// 使用示例
const aggregatedData = aggregateData(rawData);
console.log(JSON.stringify(aggregatedData, null, 2));
