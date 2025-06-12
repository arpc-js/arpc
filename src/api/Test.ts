function buildJoinSQL(meta, parentTable, alias = parentTable.toLowerCase(), path = []) {
    const fields = [];
    const joins = [];

    for (const [key, type] of Object.entries(meta)) {
        const currentPath = [...path, key];
        const aliasName = currentPath.join('__');

        if (type.endsWith('[]')) {
            // 一对多（或多对多）
            const table = type.slice(0, -2);
            joins.push(`LEFT JOIN ${table} ${aliasName} ON ${aliasName}.${parentTable.toLowerCase()}Id = ${alias}.id`);
            const subMeta = globalModels?.[table]?.meta || {};
            const sub = buildJoinSQL(subMeta, table, aliasName, currentPath);
            joins.push(...sub.joins);
            fields.push(...sub.fields);
        } else if (/^[A-Z]/.test(type)) {
            // 一对一
            const table = type;
            joins.push(`LEFT JOIN ${table} ${aliasName} ON ${aliasName}.id = ${alias}.${key}Id`);
            const subMeta = globalModels?.[table]?.meta || {};
            const sub = buildJoinSQL(subMeta, table, aliasName, currentPath);
            joins.push(...sub.joins);
            fields.push(...sub.fields);
        } else {
            // 普通字段
            fields.push(`${alias}.${key} AS "${currentPath.join('__')}"`);
        }
    }

    return { fields, joins };
}
