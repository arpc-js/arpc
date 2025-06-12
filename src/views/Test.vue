<script setup lang="ts">
import {User} from "../api/User.ts";
import {onMounted, ref} from "vue";
let msg=ref('')
let u=new User()
onMounted(async ()=>{
  //这是云对象，rpc调用后端对象的
  msg.value=JSON.stringify(await u.getById(1))
})
</script>

<template>
  <div>管理系统</div>
{{msg}}
</template>

<style scoped>

</style>
