<template>
  <view class="login-container">
    <!-- 登录头部 -->
    <view class="login-header">
      <image class="logo" src="/static/logo.png"></image>
      <text class="welcome-text">欢迎登录</text>
    </view>

    <!-- 登录切换 -->
    <view class="login-switch">
      <text :class="['switch-item', { active: loginType === 'username' }]" @click="loginType = 'username'">
        用户名密码登录
      </text>
      <text :class="['switch-item', { active: loginType === 'phone' }]" @click="loginType = 'phone'">
        手机号验证码登录
      </text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 用户名密码登录 -->
      <view v-if="loginType === 'username'">
        <view class="form-item">
          <input class="input" type="text" v-model="obj.name" placeholder="请输入用户名" maxlength="30" />
        </view>
        <view class="form-item">
          <input class="input" type="password" v-model="obj.pwd" placeholder="请输入密码" maxlength="30" />
        </view>
      </view>

      <!-- 手机号验证码登录 -->
      <view v-else>
        <view class="form-item">
          <input
              class="input"
              type="number"
              v-model="phone"
              placeholder="请输入手机号"
              maxlength="11"
              @input="validatePhone"
          />
          <view class="clear-btn" @click="phone = ''" v-show="phone">
            <uni-icons type="clear" size="20" color="#999" />
          </view>
        </view>
        <view class="form-item">
          <input class="input" type="number" v-model="code" placeholder="请输入验证码" maxlength="6" />
          <view
              class="code-btn"
              :class="{ disabled: !canGetCode || codeBtnText !== '获取验证码' }"
              @click="getSMSCode"
          >
            {{ codeBtnText }}
          </view>
        </view>
      </view>

      <!-- 登录按钮 -->
      <button class="login-btn" @click="handleLogin">登录</button>

      <!-- 第三方登录 -->
      <view class="third-login">
        <text class="third-text">其他登录方式</text>
        <view class="third-icons">
          <button class="wx-btn" open-type="getPhoneNumber" @getphonenumber="wxLogin">
            <image class="wx-icon" src="/static/wx.jpg" />
          </button>
        </view>
      </view>

      <!-- 用户协议 -->
      <view class="agreement">
        <checkbox-group @change="toggleAgree">
          <checkbox :checked="isAgree" color="#07c160" />
        </checkbox-group>
        <text class="agreement-text">
          已阅读并同意
          <text class="link" @click="navigateToAgreement">《用户协议》</text>
          和
          <text class="link" @click="navigateToPrivacy">《隐私政策》</text>
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { User } from '../../arpc/User'

const loginType = ref('username')
const username = ref('')
const password = ref('')
const phone = ref('')
const code = ref('')
const isAgree = ref(false)
const codeBtnText = ref('获取验证码')
const canGetCode = ref(false)
const countDown = ref(60)
let timer = null
let obj=new User()
const canLogin = computed(() => {
  if (!isAgree.value) return false
  if (loginType.value === 'username') {
    return username.value.trim() && password.value.trim()
  } else {
    return phone.value.length === 11 && code.value.length === 6
  }
})

const validatePhone = () => {
  const reg = /^1[3-9]\d{9}$/
  canGetCode.value = reg.test(phone.value)
}

const getSMSCode = async () => {
  if (!canGetCode.value || codeBtnText.value !== '获取验证码') return
  try {
    const res = await uni.request({
      url: '/api/sms/send',
      method: 'POST',
      data: { phone: phone.value }
    })
    if (res.data.code === 200) {
      uni.showToast({ title: '验证码已发送' })
      startCountDown()
    }
  } catch (e) {
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

const startCountDown = () => {
  codeBtnText.value = `${countDown.value}s后重新获取`
  timer = setInterval(() => {
    countDown.value--
    if (countDown.value <= 0) {
      clearInterval(timer)
      codeBtnText.value = '获取验证码'
      countDown.value = 60
    } else {
      codeBtnText.value = `${countDown.value}s后重新获取`
    }
  }, 1000)
}

const handleLogin = async () => {
  if (!isAgree.value) {
    return uni.showToast({ title: '请先同意协议', icon: 'none' })
  }
  let {token,uid,name}=await obj.login()
  uni.setStorageSync('token', token)
  uni.setStorageSync('uid',uid)
  uni.setStorageSync('name',name)
  uni.reLaunch({ url: '/pages/index/index' })
}

const wxLogin = async (e) => {
  if (!isAgree.value) {
    return uni.showToast({ title: '请先同意协议', icon: 'none' })
  }
  uni.login({
    provider: 'weixin',
    success: async (res) => {
      try {
        const loginRes = await uni.request({
          url: '/api/login/wechat',
          method: 'POST',
          data: {
            code: res.code,
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv
          }
        })
        if (loginRes.data.code === 200) {
          uni.setStorageSync('token', loginRes.data.token)
          uni.reLaunch({ url: '/pages/home/index' })
        }
      } catch {
        uni.showToast({ title: '微信登录失败', icon: 'none' })
      }
    }
  })
}

const toggleAgree = (e) => {
  isAgree.value = e.detail.value.length > 0
}

const navigateToAgreement = () => {
  uni.navigateTo({ url: '/pages/agreement/user' })
}
const navigateToPrivacy = () => {
  uni.navigateTo({ url: '/pages/agreement/privacy' })
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
/* 所有 style 保持不变，原样粘贴 */
.login-container {
  padding: 60rpx 40rpx;
}
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}
.logo {
  width: 150rpx;
  height: 150rpx;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
}
.welcome-text {
  font-size: 48rpx;
  color: #333;
  font-weight: bold;
}
.login-switch {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
}
.switch-item {
  margin: 0 30rpx;
  font-size: 30rpx;
  color: #999;
  cursor: pointer;
  padding-bottom: 10rpx;
  border-bottom: 2rpx solid transparent;
  user-select: none;
}
.switch-item.active {
  color: #07c160;
  border-bottom-color: #07c160;
}
.form-item {
  position: relative;
  margin-bottom: 40rpx;
  border-bottom: 1rpx solid #eee;
  padding: 20rpx 0;
}
.input {
  height: 80rpx;
  padding-right: 160rpx;
  font-size: 32rpx;
  width: 100%;
  box-sizing: border-box;
}
.clear-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  padding: 20rpx;
}
.code-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  color: #07c160;
  font-size: 28rpx;
  padding: 10rpx 20rpx;
  border-left: 1rpx solid #eee;
  user-select: none;
}
.code-btn.disabled {
  color: #999;
  pointer-events: none;
}
.login-btn {
  margin-top: 60rpx;
  background-color: #07c160;
  color: #fff;
  border-radius: 50rpx;
  height: 90rpx;
  line-height: 90rpx;
  font-size: 34rpx;
}
.login-btn[disabled] {
  background-color: #a0e8a0;
}
.third-login {
  margin-top: 80rpx;
  text-align: center;
}
.third-text {
  color: #999;
  font-size: 28rpx;
}
.third-icons {
  margin-top: 30rpx;
  display: flex;
  justify-content: center;
}
.wx-btn {
  padding: 0;
  background: transparent;
  line-height: 1;
  margin: 0 20rpx;
}
.wx-btn::after {
  border: none;
}
.wx-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  object-fit: cover;
}
.agreement {
  margin-top: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.agreement-text {
  font-size: 24rpx;
  color: #666;
  margin-left: 10rpx;
}
.link {
  color: #07c160;
  cursor: pointer;
  user-select: none;
}
</style>
