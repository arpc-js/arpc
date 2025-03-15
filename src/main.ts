import { createApp } from 'vue'
import App from './App.vue'
const app=createApp(App)
app.config.globalProperties.to  = (url)=>{
    uni.navigateTo({  url: url})
}
app.mount('#app')
