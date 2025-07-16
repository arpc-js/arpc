export function deepClear(obj) {
    Object.keys(obj).forEach(key => {
        if (key === 'list' || key === 'page'|| key === 'sel') return;
        const val = obj[key];
        if (Array.isArray(val)) {
            obj[key] = [];
        } else if (val !== null && typeof val === 'object') {
            obj[key] = {};
        } else {
            obj[key] = undefined;
        }
    });
}
