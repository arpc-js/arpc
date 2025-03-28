<script setup lang="ts">
import {onLaunch, onShow, onHide, onError} from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onError((e)=>{
  uni.showToast({title: `${JSON.stringify(e)}`,icon:'none'});
  console.error('捕获到全局错误:', e);
  //403异常跳转到登录页面
  if (e=='403'){
    uni.reLaunch({  url: '/pages/login/login' })
  }
})
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
