<template>
  <view class="container">
    <!-- 自定义消息列表 -->
    <view class="message-list">
      <navigator
          v-for="(item, uid) in chatStore.unreadMap"
          :key="uid"
          :url="`/pages/chat/chat?id=${uid}`"
          class="message-item"
          hover-class="message-item-hover"
      >
        <!-- 头像 -->
        <image class="avatar" :src="item.icon || defaultAvatar"></image>

        <!-- 消息主体 -->
        <view class="content">
          <!-- 标题行 -->
          <view class="title-line">
            <text class="name">{{ item.name }}</text>
            <text class="time">{{ formatTime(item.time) }}</text>
          </view>

          <!-- 消息预览 -->
          <view class="preview-line">
            <text v-if="typeof item.msg=='string'" class="message">{{ item.msg }}</text>
            <uni-icons v-else   type="location" size="30"></uni-icons>
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
import {computed, getCurrentInstance, watchEffect} from 'vue';
import {onShow} from "@dcloudio/uni-app";

const instance = getCurrentInstance();
const chatStore = instance?.appContext.config.globalProperties.chatStore;

// 默认头像
const defaultAvatar = 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png'

// 时间格式化方法
const formatTime = (timestamp: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 未读消息总数
const totalUnread = computed(() => {
  return Object.values(chatStore.unreadMap).reduce(
      (acc: number, item: any) => acc + (item?.count || 0),
      0
  );
});
onShow(() => {
  const count = instance?.appContext.config.globalProperties.chatStore['totalUnread']
  console.log('count',count)
  uni.setTabBarBadge({
    index: 1,
    text: count > 0 ? count.toString() : ''
  })
})
</script>

<style lang="scss">
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.message-list {
  padding: 10rpx 20rpx;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 1rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.05);

  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 8rpx;
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .title-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12rpx;

    .name {
      font-size: 34rpx;
      color: #333;
      font-weight: 520;
      max-width: 400rpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 20rpx;
    }

    .badge {
      background-color: #f56c6c;
      color: #fff;
      font-size: 24rpx;
      min-width: 36rpx;
      height: 36rpx;
      line-height: 36rpx;
      border-radius: 18rpx;
      text-align: center;
      padding: 0 10rpx;
    }
  }
}

.message-item-hover {
  background-color: #f5f5f5;
  opacity: 0.9;
}
</style>
