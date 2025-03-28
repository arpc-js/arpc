import { createApp } from 'vue'
import {reactive,computed,watchEffect} from "vue"
import App from './App.vue'
import {ChatStore} from "./utils/chatStore.ts";
const app=createApp(App)
app.config.globalProperties.chatStore=reactive(new ChatStore())
app.config.globalProperties.to  = (url)=>{
    uni.navigateTo({  url: url})
}
app.config.globalProperties.initWs=initWs
initWs()
// 添加响应式未读总数计算属性
app.config.globalProperties.chatStore['totalUnread'] = computed(() => {
    return Object.values(app.config.globalProperties.chatStore.unreadMap).reduce((total, item) => {
        console.log(item)
        return total + (item['count'] || 0)
    }, 0)
})
watchEffect(() => {
    const count = app.config.globalProperties.chatStore['totalUnread']
    console.log('count',count)
    uni.setTabBarBadge({
        index: 1,
        text: count > 0 ? count.toString() : ''
    })
})
app.mount('#app')
let pingInterval = null  // 存储定时器ID
function initWs() {
    let token=uni.getStorageSync('token')
    if (token){
        if (pingInterval) {
            clearInterval(pingInterval)
            pingInterval = null
        }
        connect(token)
        uni.onSocketOpen(function (res) {
            console.log('WebSocket连接已打开！',res);
        });
        uni.onSocketMessage(rsp=>{
            console.log(rsp.data,typeof rsp.data)
            let msg=JSON.parse(rsp.data)
            if (msg.msg=='order'){
                const innerAudioContext = uni.createInnerAudioContext();
                innerAudioContext.autoplay = true;
                innerAudioContext.src = `https://chenmeijia.top/static/order.mp3`;
                innerAudioContext.onPlay(() => {});
            }
            app.config.globalProperties.chatStore.receiveMsg(msg)
        })
        uni.onSocketClose(rsp=>{
            console.log('close',rsp)
            connect(token)
        })
        uni.onSocketError(rsp=>{
            console.log('net err reconnect',rsp)
            connect(token)
        })
        //heartbeat
        pingInterval=setInterval(()=>{
            console.log('ping')
            uni.sendSocketMessage({
                data: JSON.stringify({tp:'ping'}),
                fail(result) {
                    console.log('ping err')
                     connect(token)
                },
            })
        },10000)
    }
}
function connect(token) {
    uni.connectSocket({
        url:`wss://chenmeijia.top/ws`,
        header:{Authorization:token}
    })
}
