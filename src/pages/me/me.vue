<template>
  <view class="container">
    <!-- 用户信息头部 -->
    <view class="user-info" @click="navigateToUserProfile">
      <view class="info-left">
        <image class="avatar" :src="user?.avatar"></image>
        <view class="user-detail">
          <text class="username">{{ user?.name }}</text>
          <text class="wechat-id">微信号：{{ userInfo.wechatId }}</text>
        </view>
      </view>
      <view class="info-right">
        <uni-icons type="arrowright" size="20" color="#666"></uni-icons>
      </view>
    </view>
    <!-- 功能列表 -->
    <uni-list class="menu-list">
      <uni-list-item
          title="订单"
          showArrow
          thumb="/static/icons/pay.png"
          thumb-size="20"
      />
    </uni-list>

    <uni-list class="menu-list">
      <uni-list-item
          title="收藏"
          showArrow
          thumb="/static/icons/favorite.png"
          thumb-size="20"
      />
      <uni-list-item
          title="相册"
          showArrow
          thumb="/static/icons/album.png"
          thumb-size="20"
      />
      <uni-list-item
          title="卡包"
          showArrow
          thumb="/static/icons/card.png"
          thumb-size="20"
      />
      <uni-list-item
          title="表情"
          showArrow
          thumb="/static/icons/emoji.png"
          thumb-size="20"
      />
    </uni-list>

    <uni-list class="menu-list">
      <uni-list-item
          title="设置"
          showArrow
          thumb="/static/icons/settings.png"
          thumb-size="20"
      />
    </uni-list>

    <!-- 退出登录 -->
    <view class="logout" @click="handleLogout">
      <text class="logout-text">退出登录</text>
    </view>
  </view>
</template>

<script>
import {User} from "../../api/User";

export default {
  data() {
    return {
      user:null,
      userInfo: {
        avatar: 'https://wx3.sinaimg.cn/mw690/006i0nC8ly1hquk6owrwoj31o01o0qs9.jpg',
        nickname: '微信用户',
        wechatId: 'id_743616453',
      }
    }
  },
  async onLoad(options) {
    //调用云函数
    //自研云函数代替http
    //表面前端操作数据库，其实是云端操作
    let u=new User()
    let rsp=await u.getById(uni.getStorageSync('uid'))
    this.user=rsp
    console.log(rsp)
  },
  methods: {
    navigateToUserProfile() {
      uni.navigateTo({
        url: '/pages/user/profile'
      })
    },
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 执行退出登录逻辑
          }
        }
      })
    }
  }
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
