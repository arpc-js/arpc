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
          v-for="(item, index) in messageList"
          :key="index"
          class="message-item"
          :class="item.type === 'self' ? 'self-message' : 'other-message'"
      >
        <!-- 对方头像 -->
        <image
            v-if="item.type === 'other'"
            class="avatar"
            :src="item.avatar"
        ></image>

        <!-- 消息内容 -->
        <view class="message-bubble">
          <text class="message-text">{{ item.content }}</text>
        </view>

        <!-- 自己头像 -->
        <image
            v-if="item.type === 'self'"
            class="avatar"
            :src="item.avatar"
        ></image>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <input
          class="input"
          v-model="inputMessage"
          placeholder="输入消息..."
          @confirm="sendMessage"
      />
      <button class="send-btn" @click="sendMessage">发送</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      inputMessage: '',
      scrollTop: 0,
      messageList: [
        {
          type: 'other',
          content: '你好呀！',
          avatar: 'https://wx3.sinaimg.cn/mw690/006i0nC8ly1hquk6owrwoj31o01o0qs9.jpg'
        },
        {
          type: 'self',
          content: '你好！最近怎么样？',
          avatar: 'https://ww1.sinaimg.cn/mw690/c4877746ly1hsxzy9qflcj20sq0sq7a1.jpg'
        }
      ]
    }
  },
  methods: {
    sendMessage() {
      if (!this.inputMessage.trim()) return

      this.messageList.push({
        type: 'self',
        content: this.inputMessage,
        avatar: '/static/my-avatar.png'
      })

      // 清空输入框
      this.inputMessage = ''

      // 滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    scrollerToBottom() {
      this.scrollTop = 99999  // 设置一个足够大的值确保滚动到底部
    },
    loadHistory() {
      // 加载历史消息逻辑
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
</style>
