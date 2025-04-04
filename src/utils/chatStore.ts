import {reactive, computed, watchEffect} from "vue"
import type {ComputedRef} from "@vue/runtime-core";

export class ChatStore {
    scrollTop=0
    unreadMap={}
    messages=[]
    totalUnread:ComputedRef<unknown>
    constructor() {
        this.unreadMap = uni.getStorageSync('unreadMap') || {};
    }
    hide(uid){
        delete this.unreadMap[uid]
        uni.setStorageSync('unreadMap',this.unreadMap)
    }
    del(uid){
        delete this.unreadMap[uid]
        uni.setStorageSync('unreadMap',this.unreadMap)
        uni.removeStorage({key:`messages-${uid}`})
    }
    chat(uid){

        this.messages = uni.getStorageSync(`messages-${uid}`) ||[];
        //曾经聊过天，未读置0，没聊过就没有未读不操作
        if (this.unreadMap[uid]){this.unreadMap[uid]['count']=0}
        uni.setStorageSync('unreadMap',this.unreadMap)
    }
    send(to,msg){
        let msglocal={
            uid: uni.getStorageSync('uid'),
            name: uni.getStorageSync('name'),
            icon: uni.getStorageSync('avatar'),
            time: new Date().getTime(),
            msg: msg
        }
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        if (currentPage.route.includes('chat')){
            msglocal['count']=0
            this.unreadMap[to]=msglocal
            uni.setStorageSync('unreadMap',this.unreadMap)
            this.messages.push(msglocal)
            uni.setStorageSync(`messages-${to}`,this.messages)
        }else {
            let unread=this.unreadMap[to]||{count:0}
            msglocal['count']=unread['count']+1
            this.unreadMap[to]=msglocal
            uni.setStorageSync('unreadMap',this.unreadMap)

            let msgs = uni.getStorageSync(`messages-${to}`) ||[]
            msgs.push(msglocal)
            uni.setStorageSync(`messages-${to}`,msgs)
        }
        this.scrollTop=this.scrollTop+100
    }
    receive(msg){
        // 获取当前页面路由路径
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        console.log(' 当前页面路径:', currentPage.route);
         let uid=msg['uid']
        if (currentPage.route.includes('chat')){
            msg['count']=0
            this.unreadMap[uid]=msg
            uni.setStorageSync('unreadMap',this.unreadMap)
            this.messages.push(msg)
            uni.setStorageSync(`messages-${uid}`,this.messages)
        }else {
            let unread=this.unreadMap[uid]||{count:0}
            msg['count']=unread['count']+1
            this.unreadMap[uid]=msg
            uni.setStorageSync('unreadMap',this.unreadMap)

            let msgs = uni.getStorageSync(`messages-${uid}`) ||[]
            msgs.push(msg)
            uni.setStorageSync(`messages-${uid}`,msgs)
        }
        this.scrollTop=this.scrollTop+100
    }
}
