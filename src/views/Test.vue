<script setup lang="ts">
import {User} from "../api/User.ts";
import {onMounted, ref} from "vue";
import {Stu} from "../api/Stu.ts";
let msg=ref('')
onMounted(async ()=>{
  //这是云对象，rpc调用后端对象的
  msg.value=JSON.stringify(await new User().add1(1,'zs'))
})
</script>

<template>
  <div>管理系统</div>
{{msg}}
</template>

<style scoped>

</style>
