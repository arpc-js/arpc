declare global {
    interface Promise<T> {
        err(msg: string): Promise<T>;
    }
}
export {}; // 关键！让这个文件成为模块，避免全局污染报错
