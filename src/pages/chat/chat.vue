<template>
  <view class="chat-container">
    <!-- 聊天内容区域 -->
    <scroll-view
        class="chat-content"
        scroll-y
        :scroll-top="chatStore.scrollTop"
        @scrolltoupper="loadHistory"
    >
      <view
          v-for="(item, index) in chatStore.messages"
          :key="index"
          class="message-item"
          :class="item.uid === myid ? 'self-message' : 'other-message'"
      >
        <!-- 对方头像 -->
        <image
            v-if="item.uid != myid"
            class="avatar"
            :src="item.icon"
        ></image>

        <!-- 消息内容 -->
        <view class="message-bubble">
          <text v-if="typeof item.msg=='string'" class="message-text">{{ item.msg }}</text>
          <uni-icons v-else @click="openLoc(item.msg)" type="location" size="30"></uni-icons>
        </view>

        <!-- 自己头像 -->
        <image
            v-if="item.uid === myid"
            class="avatar"
            :src="item.icon"
        ></image>
      </view>
    </scroll-view>

    <!-- 功能菜单 -->
    <view v-if="showActionMenu" class="action-menu">
<!--      <view class="action-item" @click="handleCall(1)">
        <uni-icons type="phone-filled" size="30"></uni-icons>
        <text>语音</text>
      </view>
      <view class="action-item" @click="handleCall(2)">
        <uni-icons type="phone-filled" size="30"></uni-icons>
        <text>视频</text>
      </view>-->
      <view class="action-item" @click="sendMessage(loc)">
        <uni-icons type="location-filled" size="30"></uni-icons>
        <text>位置</text>
      </view>
      <!--      <view class="action-item" @click="handleSendLocation">
              <image @click="sendMessage({latitude: 31.033270128038193, longitude: 121.75690321180555})" class="action-icon" src="/static/location.png"></image>
              <text>位置</text>
            </view>-->
    </view>

    <!-- 输入区域 -->
    <view class="input-area">
      <input
          class="input"
          v-model="inputMessage"
          placeholder="输入消息..."
          @confirm="sendMessage"
      />
      <view class="action-box">

        <uni-icons
            v-if="!inputMessage"
            @click="toggleActionMenu" type="plus" size="30"></uni-icons>
        <button
            v-else
            class="send-btn"
            @click="sendMessage(inputMessage)"
        >发送
        </button>
      </view>
    </view>
  </view>
</template>

<script>
// #ifdef APP-PLUS
const TUICallKit = uni.requireNativePlugin('TencentCloud-TUICallKit'); //【1】import TUICallKit plugin
// #endif
export default {
  data() {
    return {
      loc: null,
      show: false,
      uid: 0,
      myid: 0,
      inputMessage: '',
      scrollTop: 600,
      showActionMenu: false,
      messageList: []
    }
  },
  async onLoad({id,name,avatar}) {
    this.uid = id
    this.name=name
    this.avatar=decodeURIComponent(avatar)
    this.myid = uni.getStorageSync('uid')
    this.loc = uni.getStorageSync('loc')
    console.log(id)
    this.chatStore.chat(id)
  },
  onShow() {
    console.log('show')
  },
  methods: {
    openLoc(loc) {
      uni.openLocation(loc)
    },
    toggleActionMenu() {
      this.showActionMenu = !this.showActionMenu
    },
    sendMessage(msg) {
      if (!msg) return
      //本地未读列表
      if (this.chatStore.unreadMap[this.uid]){
        this.chatStore.unreadMap[this.uid].msg=msg
        this.chatStore.unreadMap[this.uid].time=new Date().getTime()
      }else {//第一次消息
        this.chatStore.unreadMap[this.uid]={
          uid: this.uid,
          name: this.name,
          icon: this.avatar,
          time: new Date().getTime(),
          msg: msg
        }
      }
      uni.setStorageSync('unreadMap',this.chatStore.unreadMap)
      //本地当前用户消息列表
      let remoteMsg={
        uid: this.myid,
        name: uni.getStorageSync('name'),
        to:this.uid,
        icon:uni.getStorageSync('avatar'),
        time: new Date().getTime(),
        msg: msg
      }
      this.chatStore.messages.push(remoteMsg)
      uni.setStorageSync(`messages-${this.uid}`,this.chatStore.messages)

      uni.sendSocketMessage({
        data: JSON.stringify(remoteMsg)
      })
      this.inputMessage = ''
      this.chatStore.scrollTop = this.chatStore.scrollTop+100
    },
    loadHistory() {
      // 加载历史消息逻辑
    },
    handleCall(tp) {
      // #ifdef APP-PLUS
      TUICallKit.calls({
        userIDList: ['2'],
        callMediaType: tp,   // 1 -- audio call，2 -- video call
        callParams: {roomID: 234, strRoomID: '2323423', timeout: 30},
      })
      // #endif
    },
    handleSendLocation() {
      uni.showToast({title: '发送位置', icon: 'none'})
      this.showActionMenu = false
    }
  }
}
</script>

<style scoped>
.video-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 999;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.chat-content {
  flex: 1;
  padding: 20rpx;
  overflow: auto;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
}

.other-message {
  justify-content: flex-start;
}

.self-message {
  justify-content: flex-end;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
}

.message-bubble {
  max-width: 500rpx;
  padding: 20rpx;
  border-radius: 10rpx;
  margin: 0 20rpx;
  position: relative;
}

.other-message .message-bubble {
  background-color: #fff;
  margin-left: 20rpx;
}

.self-message .message-bubble {
  background-color: #95ec69;
  margin-right: 20rpx;
}

.message-text {
  font-size: 28rpx;
  color: #333;
}

.input-area {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-top: 1rpx solid #eee;
}

.input {
  flex: 1;
  height: 80rpx;
  padding: 0 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 40rpx;
  margin-right: 20rpx;
}

.action-box {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-icon {
  font-size: 22px;
  width: 60rpx;
  height: 60rpx;
}

.send-btn {
  width: 180rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 16rpx;
  background-color: #07c160;
  color: #fff;
  font-size: 28rpx;
  padding: 0;
}

.action-menu {
  position: fixed;
  bottom: 120rpx;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 30rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  width: 20rpx;
  height: 1rpx;
  margin-bottom: 1rpx;
}
</style>
