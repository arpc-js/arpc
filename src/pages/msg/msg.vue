<template>
  <uni-list>
    <uni-list :border="true">
      <!-- 显示圆形头像 -->
      <uni-list-chat v-for="(v, k) in chatStore.unreadMap" :avatar-circle="true" :title="v.name" :avatar="v.icon" :note="v.msg" :time="v.time" ></uni-list-chat>

    </uni-list>
  </uni-list>


</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCurrentInstance,ref } from 'vue';
const instance = getCurrentInstance();
const chatStore = instance?.appContext.config.globalProperties.chatStore;
// 计算属性
const totalUnread = computed(() => {
  return Object.keys(chatStore.unreadMap).reduce((acc,  key) => {
    return acc + (chatStore.unreadMap[key]?.count  || 0);
  }, 0);
});
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
