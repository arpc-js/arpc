import {isThrowStatement} from "typescript";

export class ChatStore {
    chatid=0
    unreadMap={}
    messages=[]
    constructor() {
        this.unreadMap = uni.getStorageSync('unreadMap') || {};
    }
    chat(uid){
        this.chatid=uid
        this.messages = uni.getStorageSync('messages') ||[];
        this.unreadMap[uid]['count']=0
    }
    handleMsg(msg){
        const uid=msg['uid']
        if (this.chatid==uid){
            this.messages.push(msg)
            uni.setStorageSync('messages',this.messages)
        }else {
            let unread=this.unreadMap[uid]||{count:0}
            msg['count']=unread['count']+1
            this.unreadMap[uid]=msg
            uni.setStorageSync('unreadMap',this.messages)
        }
    }
}
