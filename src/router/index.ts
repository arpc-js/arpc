// src/router/index.ts
import {createRouter, createWebHistory,} from 'vue-router';
const pages = import.meta.glob('../views/**/*.vue');
// 自动生成路由配置
const routes = [];
console.log(pages)
for (const path in pages) {
    const fileName = path
        .replace('../views', '')       // 去除前缀
        .replace(/\.vue$/, '')         // 去除.vue
        .replace(/\/index$/, '');      // 支持 index.vue 作为目录默认页
    routes.push({
        path: fileName === '' ? '/' : fileName,
        component: pages[path] as any,
    });
}
// 手动添加非 views 页面组件，如首页 HelloWorld
routes.unshift({
    path: '/',
    component: () => import('../views/dash.vue'),
});
const router = createRouter({
    history: createWebHistory(),
    routes,
});
export default router;
export function to(to:  string) {
    if (typeof to === 'string') {
        // 直接用 path 字符串跳转
        router.push(to)
    }
}
