import { createApp } from 'vue'
import App from './AppVue.vue'
import router from './router';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const app = createApp(App)
app.use(router)
//@ts-ignore
app.use(ElementPlus)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component) // 注册为全局组件
}
app.mount('#app')
//@ts-ignore
window.$message = ElMessage
