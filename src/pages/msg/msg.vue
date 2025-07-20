<template>
  <view class="container">
    <!-- 自定义消息列表 -->
    <view class="message-list">
      <navigator
          v-for="item in messages"
          :key="item.uid"
          :url="`/pages/chat/chat?id=${item.uid}`"
          class="message-item"
          hover-class="message-item-hover"
          @longpress="handleLongPress(item.uid)"
      >
        <!-- 头像 -->
        <image class="avatar" :src="item.icon || defaultAvatar" />

        <!-- 内容 -->
        <view class="content">
          <view class="title-line">
            <text class="name">{{ item.name }}</text>
            <text class="time">{{ formatTime(item.time) }}</text>
          </view>

          <view class="preview-line">
            <text v-if="typeof item.msg === 'string'" class="message">{{ item.msg }}</text>
            <uni-icons v-else type="location" size="30" />
            <view v-if="item.count > 0" class="badge">
              {{ item.count > 99 ? '99+' : item.count }}
            </view>
          </view>
        </view>
      </navigator>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

// 默认头像
const defaultAvatar = 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png'

// 模拟消息数据
const messages = ref([
  {
    uid: 'u1001',
    name: '王大锤',
    icon: 'https://img.yzcdn.cn/vant/cat.jpeg',
    msg: '商家你好，请问今天上班吗？',
    time: Date.now() - 60 * 1000 * 5,
    count: 2,
  },
  {
    uid: 'u1002',
    name: '张三丰',
    icon: 'https://img.yzcdn.cn/vant/cat.jpeg',
    msg: '欢迎咨询我们的服务项目。',
    time: Date.now() - 60 * 1000 * 30,
    count: 0,
  },
  {
    uid: 'u1003',
    name: '李四',
    icon: 'https://img.yzcdn.cn/vant/cat.jpeg',
    msg: '欢迎咨询我们的服务项目。',
    time: Date.now() - 60 * 60 * 1000,
    count: 5,
  },
  {
    uid: 'u1002',
    name: '张三丰',
    icon: 'https://img.yzcdn.cn/vant/cat.jpeg',
    msg: '欢迎咨询我们的服务项目。',
    time: Date.now() - 60 * 1000 * 30,
    count: 0,
  },
  {
    uid: 'u1003',
    name: '李四',
    icon: 'https://img.yzcdn.cn/vant/cat.jpeg',
    msg: '欢迎咨询我们的服务项目。',
    time: Date.now() - 60 * 60 * 1000,
    count: 5,
  },
])

// 时间格式化
const formatTime = (timestamp: number) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes()
      .toString()
      .padStart(2, '0')}`
}

// 长按事件处理
const handleLongPress = (uid: string) => {
  uni.showActionSheet({
    itemList: ['删除', '标记已读'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 删除消息
        messages.value = messages.value.filter((item) => item.uid !== uid)
      } else if (res.tapIndex === 1) {
        // 标记为已读
        const msg = messages.value.find((item) => item.uid === uid)
        if (msg) msg.count = 0
      }
    },
  })
}

onShow(() => {
  const unreadTotal = messages.value.reduce((sum, m) => sum + (m.count || 0), 0)
  if (unreadTotal > 0) {
    uni.setTabBarBadge({
      index: 1,
      text: unreadTotal > 99 ? '99+' : String(unreadTotal),
    })
  } else {
    uni.removeTabBarBadge({ index: 1 })
  }
})
</script>

<style lang="scss" scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.message-list {
  padding: 10rpx 20rpx;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  margin-right: 20rpx;
  object-fit: cover;
}

.content {
  flex: 1;
}

.title-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;

  .name {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }

  .time {
    font-size: 24rpx;
    color: #999;
  }
}

.preview-line {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .message {
    font-size: 28rpx;
    color: #666;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    margin-right: 20rpx;
  }

  .badge {
    background-color: #f56c6c;
    color: white;
    font-size: 24rpx;
    padding: 0 12rpx;
    border-radius: 20rpx;
    min-width: 36rpx;
    text-align: center;
    height: 36rpx;
    line-height: 36rpx;
  }
}

.message-item-hover {
  background-color: #f0f0f0;
}
</style>
