function dynamicGroup(rows, levels) {
    function groupLevel(data, depth) {
        if (depth >= levels.length) return data;

        const key = levels[depth];
        const grouped = new Map();

        for (const row of data) {
            const groupKey = row[key];
            if (!grouped.has(groupKey)) {
                grouped.set(groupKey, []);
            }
            grouped.get(groupKey).push(row);
        }

        const result = [];

        for (const [groupKey, groupRows] of grouped) {
            const first = groupRows[0];
            const entry = { [key]: groupKey };

            // 拷贝当前层的非分组字段
            for (const k in first) {
                if (!levels.includes(k)) {
                    entry[k] = first[k];
                }
            }

            // 递归分组下一层
            const children = groupLevel(groupRows, depth + 1);
            if (Array.isArray(children)) {
                const nextKey = levels[depth + 1];
                if (nextKey) {
                    entry[nextKey.endsWith('_id') ? nextKey.replace(/_id$/, 's') : nextKey + 's'] = children;
                }
            }

            result.push(entry);
        }

        return result;
    }

    return groupLevel(rows, 0);
}
const mockDbRows = [
    {
        user_id: 42,
        user_name: 'Alice',
        role_id: 3,
        role_name: 'Admin',
        permission_id: 5,
        permission_code: 'write',
    },
    {
        user_id: 42,
        user_name: 'Alice',
        role_id: 3,
        role_name: 'Admin',
        permission_id: 6,
        permission_code: 'read',
    },
    {
        user_id: 42,
        user_name: 'Alice',
        role_id: 4,
        role_name: 'User',
        permission_id: null,
        permission_code: null,
    }
];

const grouped = dynamicGroup(mockDbRows, ['user_id', 'role_id', 'permission_id']);
//默认role_id变成roles,可以指定映射
console.log(JSON.stringify(grouped, null, 2));
