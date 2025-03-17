// 原始数据
const masterData = [
    { id: 'M1', name: '主表1' },
    { id: 'M2', name: '主表2' }
];

const detailData = [
    { mid: 'M1', item: '子项A', value: 10 },
    { mid: 'M1', item: '子项B', value: 20 },
    { mid: 'M2', item: '子项C', value: 30 }
];

/*// 1. 使用 groupBy 对子表按外键分组
const groupedDetails = Object.groupBy(
    detailData,
    ({ mid }) => mid // 按主表ID分组
);

// 2. 合并到主表
const aggregated = masterData.map(master => ({
    ...master,
    details: groupedDetails[master.id] || [] // 处理空子表情况
}));

console.log(JSON.stringify(aggregated));*/
/*
[
  { id: 'M1', name: '主表1', details: [...] },
  { id: 'M2', name: '主表2', details: [...] }
]
*/
const aggregateData = (master, details) => {
    // 1. 创建子表索引
    const detailMap = details.reduce((acc, detail) => {
        const key = detail.mid;
        (acc[key] = acc[key] || []).push(detail);
        return acc;
    });
    // 2. 合并主表数据
    return master.map(item => ({
        ...item,
        details: detailMap[item.id] || []
    }));
};

// 使用示例
const result = aggregateData(masterData, detailData);
console.log(result)
