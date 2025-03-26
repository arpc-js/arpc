<template>
  <scroll-view>
   <img src="https://chenmeijia.top/static/spu1-1.jpg" mode="widthFix" style="width: 100%;">
  </scroll-view>
</template>

<script setup lang="ts">
import {onLoad} from "@dcloudio/uni-app";

onLoad(({id,url}) => {
  console.log(' 接收到的参数:', decodeURIComponent(url))
})
</script>


<style scoped lang="scss">

</style>
