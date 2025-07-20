<template>
  <view class="container">
    <!-- 用户信息头部 -->
    <view class="user-info" @click="to('/pages/me/setting')">
      <view class="info-left">
        <image class="avatar" src="https://img.yzcdn.cn/vant/cat.jpeg" />
        <view class="user-detail">
          <text class="username">{{ name }}</text>
<!--          <text class="wechat-id">城市：{{ user?.city }}</text>
          <text class="wechat-id">余额：{{ user?.balance }}</text>-->
        </view>
      </view>
      <view class="info-right">
        <uni-icons type="arrowright" size="20" color="#666" />
      </view>
    </view>

    <!-- 功能列表 -->
    <uni-list class="menu-list">
      <navigator url="/pages/order/order">
        <uni-list-item title="订单" showArrow thumb="https://img.yzcdn.cn/vant/cat.jpeg" thumb-size="20" />
      </navigator>
      <navigator url="/pages/recharge/recharge">
        <uni-list-item title="充值" showArrow thumb="https://img.yzcdn.cn/vant/cat.jpeg" thumb-size="20" />
      </navigator>
      <navigator url="/pages/jishi/register">
        <uni-list-item title="师傅入驻" showArrow thumb="https://img.yzcdn.cn/vant/cat.jpeg" thumb-size="20" />
      </navigator>
    </uni-list>

    <navigator url="/pages/me/setting">
      <uni-list-item title="设置" showArrow thumb="https://img.yzcdn.cn/vant/cat.jpeg" thumb-size="20" />
    </navigator>

    <!-- 清缓存 -->
<!--    <view class="logout" @click="clearStorage">
      <text class="logout-text">清缓存</text>
    </view>-->

    <!-- 退出登录 -->
    <view class="logout" @click="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { User } from '@/arpc/User'

const user = new User()
const uid = uni.getStorageSync('uid')
const name = uni.getStorageSync('name')
onMounted(() => {
  //fetchUser()
})
const fetchUser = async () => {
  try {
    const uid = uni.getStorageSync('uid')
    const name = uni.getStorageSync('name')
    if (!uid) return
    const data = await User.get(uid)
    user.value = data
  } catch (e) {
    console.error('获取用户信息失败', e)
  }
}

const to = (url) => {
  uni.navigateTo({ url })
}

const clearStorage = () => {
  uni.clearStorage()
  uni.showToast({ title: '缓存已清除', icon: 'none' })
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorage()
        uni.setStorageSync('uid', '')
        uni.setStorageSync('token', '')
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}

</script>

<style scoped>
.container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
}

.info-left {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
  border: 2rpx solid #eee;
}

.user-detail {
  display: flex;
  flex-direction: column;
}

.username {
  font-size: 34rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.wechat-id {
  font-size: 24rpx;
  color: #666;
}

.menu-list {
  margin-bottom: 20rpx;
}

.logout {
  margin: 40rpx 30rpx;
  padding: 30rpx;
  background-color: #fff;
  text-align: center;
  border-radius: 10rpx;
}

.logout-text {
  color: #e64340;
  font-size: 32rpx;
}
</style>
