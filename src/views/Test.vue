<script setup lang="ts">
import {User} from "../arpc/User.ts";
import {onMounted, ref} from "vue";
import {Role} from "../arpc/Role.ts";
import {Permission} from "../arpc/Permission.ts";
let msg=ref('')
let u=new User()
onMounted(async ()=>{
  //这是云对象，rpc调用后端对象的User.sel('id','name').get`id=${1}`
  //msg.value=JSON.stringify(await User.sel('id','name',Role.sel('id','name',Permission.sel('id','name'))).get`id=${3}`)
  msg.value=await u.getOrder(3)
})
</script>
<template>
  <div>管理系统</div>
{{msg}}
</template>

<style scoped>

</style>
