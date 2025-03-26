export class ChatStore {
    scrollTop=0
    unreadMap={}
    messages=[]
    constructor() {
        this.unreadMap = uni.getStorageSync('unreadMap') || {};
    }
    chat(uid){
        this.scrollTop=9999
        this.messages = uni.getStorageSync(`messages-${uid}`) ||[];
        this.unreadMap[uid]['count']=0
        uni.setStorageSync('unreadMap',this.unreadMap)
    }
    receiveMsg(msg,){
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
