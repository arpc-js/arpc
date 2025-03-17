import { createApp } from 'vue'
import {reactive} from "vue"
import App from './App.vue'
import {ChatStore} from "./utils/chatStore.ts";
const app=createApp(App)
app.config.globalProperties.chatStore=reactive(new ChatStore())
app.config.globalProperties.to  = (url)=>{
    uni.navigateTo({  url: url})
}
app.mount('#app')
