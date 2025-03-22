<template>
  <view class="chat-container">
    <!-- 聊天内容区域 -->
    <scroll-view
        class="chat-content"
        scroll-y
        :scroll-top="scrollTop"
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
          <text class="message-text">{{ item.msg }}</text>
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
      <view class="action-item" @click="handleVoiceCall">
        <image class="action-icon" src="/static/voice-call.png"></image>
        <text>语音</text>
      </view>
      <view class="action-item" @click="handleVideoCall">
        <image class="action-icon" src="/static/video-call.png"></image>
        <text>视频</text>
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
        <text
            v-if="!inputMessage"
            class="add-icon"
            src="/static/add.png"
            @click="toggleActionMenu"
        >+</text>
        <button
            v-else
            class="send-btn"
            @click="sendMessage"
        >发送</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      uid:0,
      myid:0,
      inputMessage: '',
      scrollTop: 0,
      showActionMenu: false,
      messageList: [
        // 原有测试数据...
      ]
    }
  },
  async onLoad({id}) {
    this.uid=id
    this.myid=uni.getStorageSync('uid')
    console.log(id)
    this.chatStore.chat(id)
  },
  methods: {
    toggleActionMenu() {
      this.showActionMenu = !this.showActionMenu
    },
    sendMessage() {
      if (!this.inputMessage.trim()) return
      this.chatStore.handleMsg({
        uid:this.myid,
        name:'我',
        icon:'https://img2.baidu.com/it/u=2955298602,2265234608&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500',
        time:new Date().getTime(),
        msg:this.inputMessage
      }, this.uid)

      this.inputMessage = ''
      this.$nextTick(() => {
        this.scrollerToBottom()
      })
    },
    scrollerToBottom() {
      this.scrollTop = 99999
    },
    loadHistory() {
      // 加载历史消息逻辑
    },
    handleVoiceCall() {
      uni.showToast({ title: '发起语音通话', icon: 'none' })
      this.showActionMenu = false
    },
    handleVideoCall() {
      uni.showToast({ title: '发起视频通话', icon: 'none' })
      this.showActionMenu = false
    },
    handleSendLocation() {
      uni.showToast({ title: '发送位置', icon: 'none' })
      this.showActionMenu = false
    }
  }
}
</script>

<style scoped>
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
  width: 60rpx;
  height: 60rpx;
}

.send-btn {
  width: 140rpx;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
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
  box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.1);
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
