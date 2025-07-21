export function interceptor(target: any, key: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
        if (key == 'reset') {
            deepClear(this);//深度置空
            return
        }
        const result = await original.apply(this, args);
        if (key == 'getPage') {
            //deepClear(this);//深度置空
            this.list = result.list;
            this.total = result.total;
        }
        //分页双向绑定了total，变更为空自动刷新分页，不引用不影响
        return result;
    };
}
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
