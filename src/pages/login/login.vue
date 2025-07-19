<template>
  <view class="login-container">
    <!-- 登录头部 -->
    <view class="login-header">
      <image class="logo" src="/static/logo.png"></image>
      <text class="welcome-text">欢迎登录</text>
    </view>

    <!-- 登录切换 -->
    <view class="login-switch">
      <text
          :class="['switch-item', { active: loginType === 'username' }]"
          @click="loginType = 'username'"
      >用户名密码登录</text>
      <text
          :class="['switch-item', { active: loginType === 'phone' }]"
          @click="loginType = 'phone'"
      >手机号验证码登录</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">

      <!-- 用户名密码登录 -->
      <view v-if="loginType === 'username'">
        <view class="form-item">
          <input
              class="input"
              type="text"
              v-model="username"
              placeholder="请输入用户名"
              maxlength="30"
          />
          <view class="clear-btn" @click="username = ''" v-show="username">
            <uni-icons type="clear" size="20" color="#999"></uni-icons>
          </view>
        </view>

        <view class="form-item">
          <input
              class="input"
              type="password"
              v-model="password"
              placeholder="请输入密码"
              maxlength="30"
          />
          <view class="clear-btn" @click="password = ''" v-show="password">
            <uni-icons type="clear" size="20" color="#999"></uni-icons>
          </view>
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
            <uni-icons type="clear" size="20" color="#999"></uni-icons>
          </view>
        </view>

        <view class="form-item">
          <input
              class="input"
              type="number"
              v-model="code"
              placeholder="请输入验证码"
              maxlength="6"
          />
          <view
              class="code-btn"
              :class="{ disabled: !canGetCode || codeBtnText !== '获取验证码' }"
              @click="getSMSCode"
          >
            {{ codeBtnText }}
          </view>
        </view>
      </view>

      <!-- 登录按钮 :disabled="!canLogin" -->
      <button
          class="login-btn"
          @click="handleLogin"
      >
        登录
      </button>

      <!-- 第三方登录 -->
      <view class="third-login">
        <text class="third-text">其他登录方式</text>
        <view class="third-icons">
          <button
              class="wx-btn"
              open-type="getPhoneNumber"
              @getphonenumber="wxLogin"
          >
            <image
                class="wx-icon"
                src="/static/wx.jpg"
                style="width:80rpx; height:80rpx; border-radius:40rpx; object-fit:cover;"
            ></image>
          </button>
        </view>
      </view>

      <!-- 用户协议 -->
      <view class="agreement">
        <checkbox-group @change="toggleAgree">
          <checkbox :checked="isAgree" color="#07c160"/>
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

<script>
import { User } from "../../arpc/User";
export default {
  data() {
    return {
      loginType: 'username',  // 登录方式：username | phone

      // 用户名密码登录字段
      username: '',
      password: '',

      // 手机号验证码登录字段
      phone: '',
      code: '',

      isAgree: false,
      codeBtnText: '获取验证码',
      canGetCode: false,
      countDown: 60,
      timer: null,
    };
  },
  computed: {
    canLogin() {
      if (!this.isAgree) return false;
      if (this.loginType === 'username') {
        return this.username.trim().length > 0 && this.password.trim().length > 0;
      } else {
        return this.phone.length === 11 && this.code.length === 6;
      }
    }
  },
  methods: {
    validatePhone() {
      const reg = /^1[3-9]\d{9}$/;
      this.canGetCode = reg.test(this.phone);
    },

    async getSMSCode() {
      if (!this.canGetCode || this.codeBtnText !== '获取验证码') return;
      try {
        const res = await uni.request({
          url: '/api/sms/send',
          method: 'POST',
          data: { phone: this.phone }
        });
        if (res.data.code === 200) {
          uni.showToast({ title: '验证码已发送' });
          this.startCountDown();
        }
      } catch (error) {
        uni.showToast({ title: '发送失败', icon: 'none' });
      }
    },

    startCountDown() {
      this.codeBtnText = `${this.countDown}s后重新获取`;
      this.timer = setInterval(() => {
        if (this.countDown <= 0) {
          clearInterval(this.timer);
          this.codeBtnText = '获取验证码';
          this.countDown = 60;
          return;
        }
        this.countDown--;
        this.codeBtnText = `${this.countDown}s后重新获取`;
      }, 1000);
    },

    async handleLogin() {
      uni.reLaunch({ url: '/pages/me/me' });
      if (!this.isAgree) {
        uni.showToast({ title: '请先同意协议', icon: 'none' });
        return;
      }
      try {
        if (this.loginType === 'username') {
          // 用户名密码登录逻辑
          const res = await uni.request({
            url: '/api/login/username',
            method: 'POST',
            data: {
              username: this.username,
              password: this.password,
            }
          });
          if (res.data.code === 200) {
            uni.setStorageSync('token', res.data.token);
            uni.setStorageSync('uid', res.data.uid);
            uni.reLaunch({ url: '/pages/me/me' });
          } else {
            uni.showToast({ title: res.data.message || '登录失败', icon: 'none' });
          }
        } else {
          // 手机号验证码登录逻辑
          let { code } = await uni.login({ provider: 'weixin' });
          let u = new User();
          let { uid, token } = await u.login(code);
          console.log('jwt token:', token);
          uni.setStorageSync('token', token);
          uni.setStorageSync('uid', uid);
          uni.connectSocket({
            url: `ws://localhost:3000/ws`,
            header: { Authorization: token }
          });
          uni.onSocketMessage(msg => {
            console.log(msg);
            let data = JSON.parse(msg);
          });
          uni.reLaunch({ url: '/pages/me/me' });
        }
      } catch (error) {
        uni.showToast({ title: error.message || '登录失败', icon: 'none' });
      }
    },

    wxLogin(e) {
      if (!this.isAgree) {
        return uni.showToast({ title: '请先同意协议', icon: 'none' });
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
            });
            if (loginRes.data.code === 200) {
              uni.setStorageSync('token', loginRes.data.token);
              this.$to.redirect('/pages/home/index');
            }
          } catch (error) {
            uni.showToast({ title: '微信登录失败', icon: 'none' });
          }
        }
      });
    },

    toggleAgree(e) {
      this.isAgree = e.detail.value.length > 0;
    },

    navigateToAgreement() {
      this.$to.to('/pages/agreement/user');
    },
    navigateToPrivacy() {
      this.$to.to('/pages/agreement/privacy');
    }
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  }
};
</script>

<style scoped>
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
