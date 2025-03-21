<template>
  <view class="login-container">
    <!-- 登录头部 -->
    <view class="login-header">
      <image class="logo" src="/static/logo.png"></image>
      <text class="welcome-text">欢迎登录</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 手机号输入 -->
<!--      <view class="form-item">
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

      &lt;!&ndash; 验证码输入 &ndash;&gt;
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
            :class="{ disabled: !canGetCode }"
            @click="getSMSCode"
        >
          {{ codeBtnText }}
        </view>
      </view>-->

      <!-- 登录按钮 -->
      <button
          class="login-btn"
          :disabled="canLogin"
          @click="to('/pages/jishi/register')"
      >
        技师入住
      </button>
      <button
          class="login-btn"
          :disabled="canLogin"
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
            <image class="wx-icon" src="/static/wx-login.png"></image>
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
import {User} from "../../api/User";
export default {
  data() {
    return {
      u:new User(),
      phone: '',         // 手机号
      code: '',          // 验证码
      isAgree: false,    // 是否同意协议
      codeBtnText: '获取验证码', // 验证码按钮文字
      canGetCode: false, // 是否可以获取验证码
      countDown: 60      // 倒计时
    }
  },
  computed: {
    // 是否可点击登录
    canLogin() {
      return this.phone.length === 11 &&
          this.code.length === 6 &&
          this.isAgree
    }
  },
  methods: {
    // 验证手机号格式
    validatePhone() {
      const reg = /^1[3-9]\d{9}$/
      this.canGetCode = reg.test(this.phone)
    },

    // 获取短信验证码
    async getSMSCode() {
      if (!this.canGetCode || this.codeBtnText !== '获取验证码') return

      try {
        // 调用短信接口
        const res = await uni.request({
          url: '/api/sms/send',
          method: 'POST',
          data: { phone: this.phone }
        })

        if (res.data.code === 200) {
          uni.showToast({ title: '验证码已发送' })
          this.startCountDown()
        }
      } catch (error) {
        uni.showToast({ title: '发送失败', icon: 'none' })
      }
    },

    // 开始倒计时
    startCountDown() {
      this.codeBtnText = `${this.countDown}s后重新获取`
      const timer = setInterval(() => {
        if (this.countDown <= 0) {
          clearInterval(timer)
          this.codeBtnText = '获取验证码'
          this.countDown = 60
          return
        }
        this.countDown--
        this.codeBtnText = `${this.countDown}s后重新获取`
      }, 1000)
    },
    async jishi() {
      let {uid,token}=await this.u.add()
      console.log('jwt token:',token)
      uni.setStorageSync('token',token)
      uni.setStorageSync('uid',uid)
    },
    // 手机号登录
    async handleLogin() {
      try {
        let {code}=await uni.login({provider: 'weixin'})
        let {uid,token}=await this.u.login(code)
        console.log('jwt token:',token)
        uni.setStorageSync('token',token)
        uni.setStorageSync('uid',uid)
        uni.connectSocket({
          url:`ws://localhost:3000/ws`,
          header:{Authorization:token}
        })
        uni.onSocketMessage(rsp=>{
          console.log(rsp.data,typeof rsp.data)
          this.chatStore.handleMsg(JSON.parse(rsp.data))
        })
        uni.reLaunch({  url: '/pages/me/me' })
      } catch (error) {
        uni.showToast({ title: error.message, icon: 'none' })
      }
    },

    // 微信登录
    wxLogin(e) {
      if (!this.isAgree) {
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
              this.$to.redirect('/pages/home/index')
            }
          } catch (error) {
            uni.showToast({ title: '微信登录失败', icon: 'none' })
          }
        }
      })
    },

    // 协议勾选
    toggleAgree(e) {
      this.isAgree = e.detail.value.length > 0
    },

    // 查看协议
    navigateToAgreement() {
      this.$to.to('/pages/agreement/user')
    },
    navigateToPrivacy() {
      this.$to.to('/pages/agreement/privacy')
    }
  }
}
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
}

.code-btn.disabled {
  color: #999;
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
}

.wx-btn::after {
  border: none;
}

.wx-icon {
  width: 80rpx;
  height: 80rpx;
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
}
</style>
