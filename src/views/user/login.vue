<template>
  <el-container style="height: 100vh; display: flex; justify-content: center; align-items: center; background-color: #f5f7fa;">
    <el-card class="login-card" shadow="never">
      <h2 class="login-title">管理后台</h2>
      <el-form class="login-form" label-width="100px" >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="u.name" placeholder="请输入用户名" prefix-icon="el-icon-user" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input type="password" v-model="u.pwd" placeholder="请输入密码" prefix-icon="el-icon-lock" />
        </el-form-item>
        <!--        <el-form-item label="验证码" prop="captcha">
                  <el-input v-model="o.name" placeholder="请输入验证码" />
                </el-form-item>-->
        <el-form-item>
          <el-button @click="login" type="primary" size="large"  class="login-button">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </el-container>
</template>

<script setup>
import { ref} from 'vue';
import {User} from "../../api/User";
import router from "../../router";

const body = ref({
  name: '',
  pwd: '',
});
let u=new User()
async function login() {
  let {token}=await u.login();
  localStorage.setItem('token',token);
  router.push('/')
}
</script>

<style scoped>
.login-card {
  width: 400px;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  background-color: #ffffff;
}

.login-title {
  margin-bottom: 20px;
  font-size: 24px;
  text-align: center;
  color: #333;
}

.login-form {
  max-width: 100%;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-input {
  border-radius: 4px;
}

.el-button {
  width: 100%;
  border-radius: 4px;
}

.login-button {
  font-size: 16px;
}

.captcha-image {
  margin-top: 10px;
  cursor: pointer;
  width: 100%;
  height: 50px;
  object-fit: cover;
}
</style>
