<template>
  <uni-list :border="true">
      <!-- 显示圆形头像 -->
      <navigator url="#/pages/chat/chat?id=1">
        <uni-list-chat :avatar-circle="true" title="马女士" avatar="https://img0.baidu.com/it/u=2244471512,1480212176&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=800" note="你好" time="2020-02-02 20:20" ></uni-list-chat>
      </navigator>
      <uni-list-chat :avatar-circle="true" title="马女士" avatar="https://img0.baidu.com/it/u=2244471512,1480212176&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=800" note="你好" time="2020-02-02 20:20" ></uni-list-chat>
      <!-- 右侧带角标 -->
      <uni-list-chat title="张女士" avatar="https://img0.baidu.com/it/u=185737999,3802884794&fm=253&fmt=auto&app=120&f=JPEG?w=800&h=840" note="你好" time="2020-02-02 20:20" badge-text="12"></uni-list-chat>
      <!-- 头像显示圆点 -->
      <uni-list-chat title="王女士" avatar="https://img2.baidu.com/it/u=2955298602,2265234608&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500" note="你好" time="2020-02-02 20:20" badge-positon="left" badge-text="dot"></uni-list-chat>
      <!-- 头像显示角标 -->
      <uni-list-chat title="李女士" avatar="https://wx2.sinaimg.cn/mw690/007JHMfMgy1hyel2iby2lj30sg0sgtbo.jpg" note="你好" time="2020-02-02 20:20" badge-positon="left" badge-text="99"></uni-list-chat>
      <!-- 显示多头像 -->
      <uni-list-chat title="uni-app" :avatar-list="avatarList" note="你好" time="2020-02-02 20:20" badge-positon="left" badge-text="dot"></uni-list-chat>
      <!-- 自定义右侧内容 -->
      <uni-list-chat title="uni-app" :avatar-list="avatarList" note="你好" time="2020-02-02 20:20" badge-positon="left" badge-text="dot">
        <view class="chat-custom-right">
          <text class="chat-custom-text">刚刚</text>
          <!-- 需要使用 uni-icons 请自行引入 -->
          <uni-icons type="star-filled" color="#999" size="18"></uni-icons>
        </view>
      </uni-list-chat>
  </uni-list>


</template>

<script setup lang="ts">
import { ref } from 'vue'
let avatarList=ref([{
  url: 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png'
}, {
  url: 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png'
}, {
  url: 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/unicloudlogo.png'
}])
</script>

<style>

.chat-custom-right {
  flex: 1;
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
}

.chat-custom-text {
  font-size: 12px;
  color: #999;
}


</style>
