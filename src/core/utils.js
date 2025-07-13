export function deepClear(obj) {
    Object.keys(obj).forEach(key => {
        if (key === 'list' || key === 'page'|| key === 'sel') return;
        const val = obj[key];
        obj[key] = undefined;
    });
}
