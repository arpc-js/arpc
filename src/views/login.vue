<template>
  <el-container class="login-container">
    <el-card class="login-card" shadow="hover">
      <h2 class="login-title">ARPC-ADMIN</h2>
      <el-form
          class="login-form"
          label-width="0"
          :model="obj"
          @submit.prevent="login"
      >
        <el-form-item prop="name" class="input-item">
          <el-input
              v-model="obj.name"
              placeholder="用户名"
              prefix-icon="el-icon-user"
              clearable
              autocomplete="username"
          />
        </el-form-item>
        <el-form-item prop="pwd" class="input-item">
          <el-input
              v-model="obj.pwd"
              type="password"
              placeholder="密码"
              prefix-icon="el-icon-lock"
              clearable
              autocomplete="current-password"
              @keyup.enter="login"
          />
        </el-form-item>
        <el-form-item>
          <el-button
              type="primary"
              size="large"
              class="login-button"
              @click="login"
              :loading="loading"
              round
          >登录
          </el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </el-container>
</template>

<script setup>
import {reactive, ref} from 'vue';
import {User} from '../arpc/User';
import {to} from '../router';
const loading = ref(false);
const obj = new User();
async function login() {
  loading.value = true;
  const { token } = await obj.login().finally(() => loading.value = false);
  localStorage.setItem('token', token);
  to('/')
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 渐变背景更现代 */
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 20px;
}

.login-card {
  width: 380px;
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(103, 58, 183, 0.3);
  background-color: #ffffff;
  transition: box-shadow 0.3s ease;
}

.login-card:hover {
  box-shadow: 0 16px 50px rgba(103, 58, 183, 0.5);
}

.login-title {
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #4527a0;
  user-select: none;
  letter-spacing: 1.2px;
}

.login-form {
  max-width: 100%;
}

.input-item {
  margin-bottom: 25px;
}

/* 输入框圆角 + 阴影 + 字体 */
.el-input__inner {
  border-radius: 30px !important;
  box-shadow: inset 0 0 8px rgba(101, 67, 185, 0.15);
  font-size: 16px;
  padding-left: 45px !important; /* 给prefix图标留空间 */
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}

.el-input__inner:focus,
.el-input__inner:hover {
  border-color: #7e57c2 !important;
  box-shadow: 0 0 12px rgba(126, 87, 194, 0.6) !important;
}

.login-button {
  width: 100%;
  font-weight: 600;
  font-size: 18px;
  background: #7e57c2;
  border: none;
  box-shadow: 0 6px 12px rgba(126, 87, 194, 0.4);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.login-button:hover {
  background: #5e35b1;
  box-shadow: 0 8px 16px rgba(94, 53, 177, 0.6);
}

.login-button:focus {
  outline: none;
}

.el-icon-user,
.el-icon-lock {
  color: #7e57c2;
  font-size: 18px;
}
</style>
