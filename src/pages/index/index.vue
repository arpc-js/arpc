<template>
  <view class="content">
    <uni-swiper-dot class="uni-swiper-dot-box" @clickItem=clickItem :info="info" :current="current" :mode="mode"
                    :dots-styles="dotsStyles" field="content">
      <swiper class="swiper-box" @change="change" :current="swiperDotIndex">
        <swiper-item v-for="(item, index) in info" :key="index">
          <image style="width: 100%" :src="item.url"></image>
        </swiper-item>
      </swiper>
    </uni-swiper-dot>
    <uni-section title="全部项目" type="line">
      <uni-list>
        <view class="service-card">
          <image src="https://img1.baidu.com/it/u=2976758652,1214725124&fm=253&fmt=auto&app=138&f=JPEG?w=607&h=405"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">精油开背</view>

            <view class="duration-badge">
              <uni-badge text="60分钟"
                         custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>

            <view class="sales">已售1000份</view>

            <view class="price" style="display: flex">
              <text class="current-price">￥219</text>
              <text class="original-price">￥399</text>
              <button @click="to(`/pages/jishi/jishi?id=1&name=精油开背&price=1`)" type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">选择项目</button>
            </view>
          </view>
        </view>
        <view class="service-card">
          <image src="https://img1.baidu.com/it/u=2976758652,1214725124&fm=253&fmt=auto&app=138&f=JPEG?w=607&h=405"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">泰式spa</view>

            <view class="duration-badge">
              <uni-badge text="60分钟"
                         custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>

            <view class="sales">已售1000份</view>

            <view class="price" style="display: flex">
              <text class="current-price">￥219</text>
              <text class="original-price">￥399</text>
              <button @click="to(`/pages/jishi/jishi?id=1`)" type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">选择项目</button>
            </view>
          </view>
        </view>
        <view class="service-card">
          <image src="https://img1.baidu.com/it/u=2976758652,1214725124&fm=253&fmt=auto&app=138&f=JPEG?w=607&h=405"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">古法按摩</view>

            <view class="duration-badge">
              <uni-badge text="60分钟"
                         custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>

            <view class="sales">已售1000份</view>

            <view class="price" style="display: flex">
              <text class="current-price">￥219</text>
              <text class="original-price">￥399</text>
              <button @click="to(`/pages/jishi/jishi?id=1`)" type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">选择项目</button>
            </view>
          </view>
        </view>
        <view class="service-card">
          <image src="https://img1.baidu.com/it/u=2976758652,1214725124&fm=253&fmt=auto&app=138&f=JPEG?w=607&h=405"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">韩式采耳</view>

            <view class="duration-badge">
              <uni-badge text="60分钟"
                         custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>

            <view class="sales">已售10000份</view>

            <view class="price" style="display: flex">
              <text class="current-price">￥219</text>
              <text class="original-price">￥399</text>
              <button @click="to(`/pages/jishi/jishi?id=1`)" type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">选择项目</button>
            </view>
          </view>
        </view>
      </uni-list>
    </uni-section>
  </view>
</template>
<script>
import {User} from "../../api/User";
export default {
  components: {},
  data() {
    return {
      info: [{
        colorClass: 'uni-bg-red',
        url: 'https://img1.baidu.com/it/u=2976758652,1214725124&fm=253&fmt=auto&app=138&f=JPEG?w=607&h=405',
        content: '内容 A'
      },
        {
          colorClass: 'uni-bg-green',
          url: 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/shuijiao.jpg',
          content: '内容 B'
        },
        {
          colorClass: 'uni-bg-blue',
          url: 'https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/shuijiao.jpg',
          content: '内容 C'
        }
      ],
      dotStyle: [{
        backgroundColor: 'rgba(0, 0, 0, .3)',
        border: '1px rgba(0, 0, 0, .3) solid',
        color: '#fff',
        selectedBackgroundColor: 'rgba(0, 0, 0, .9)',
        selectedBorder: '1px rgba(0, 0, 0, .9) solid'
      },
        {
          backgroundColor: 'rgba(255, 90, 95,0.3)',
          border: '1px rgba(255, 90, 95,0.3) solid',
          color: '#fff',
          selectedBackgroundColor: 'rgba(255, 90, 95,0.9)',
          selectedBorder: '1px rgba(255, 90, 95,0.9) solid'
        },
        {
          backgroundColor: 'rgba(83, 200, 249,0.3)',
          border: '1px rgba(83, 200, 249,0.3) solid',
          color: '#fff',
          selectedBackgroundColor: 'rgba(83, 200, 249,0.9)',
          selectedBorder: '1px rgba(83, 200, 249,0.9) solid'
        }
      ],
      modeIndex: -1,
      styleIndex: -1,
      current: 0,
      mode: 'default',
      dotsStyles: {},
      swiperDotIndex: 0
    }
  },
  async onLoad(options) {
    console.log('chatStore:',this.chatStore)
    //两行代码前后端通信
    let u=new User()
    let token=await u.get('2')
  },
  methods: {
    change(e) {
      this.current = e.detail.current
    },
    selectStyle(index) {
      this.dotsStyles = this.dotStyle[index]
      this.styleIndex = index
    },
    selectMode(mode, index) {
      this.mode = mode
      this.modeIndex = index
      this.styleIndex = -1
      this.dotsStyles = this.dotStyle[0]
    },
    clickItem(e) {
      this.swiperDotIndex = e
    },
    onBanner(index) {
      console.log(22222, index);
    }
  }
}
</script>
<style lang="scss">
.swiper-box {
  height: 200px;
}

.swiper-item {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #fff;
}

.swiper-item0 {
  background-color: #cee1fd;
}

.swiper-item1 {
  background-color: #b2cef7;
}

.swiper-item2 {
  background-color: #cee1fd;
}

.image {
  width: 750rpx;
}

/* #ifndef APP-NVUE */
::v-deep .image img {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

/* #endif */

@media screen and (min-width: 500px) {
  .uni-swiper-dot-box {
    width: 400px;
    margin: 0 auto;
    margin-top: 8px;
  }

  .image {
    width: 100%;
  }
}

.uni-bg-red {
  background-color: #ff5a5f;
}

.uni-bg-green {
  background-color: #09bb07;
}

.uni-bg-blue {
  background-color: #007aff;
}

.example-body {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  padding: 20rpx;
}

.example-body-item {

  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 15rpx;
  padding: 15rpx;
  height: 60rpx;
  /* #ifndef APP-NVUE */
  display: flex;
  padding: 0 15rpx;
  /* #endif */
  flex: 1;
  border-color: #e5e5e5;
  border-style: solid;
  border-width: 1px;
  border-radius: 5px;
}

.example-body-item-text {
  font-size: 28rpx;
  color: #333;
}

.example-body-dots {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50px;
  background-color: #333333;
  margin-left: 10rpx;
}

.active {
  border-style: solid;
  border-color: #007aff;
  border-width: 1px;
}
</style>
<style lang="scss">
.swiper-box {
  height: 200px;
}

.swiper-item {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #fff;
}

.swiper-item0 {
  background-color: #cee1fd;
}

.swiper-item1 {
  background-color: #b2cef7;
}

.swiper-item2 {
  background-color: #cee1fd;
}

.image {
  width: 750rpx;
}

/* #ifndef APP-NVUE */
::v-deep .image img {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

/* #endif */

@media screen and (min-width: 500px) {
  .uni-swiper-dot-box {
    width: 400px;
    margin: 0 auto;
    margin-top: 8px;
  }

  .image {
    width: 100%;
  }
}

.uni-bg-red {
  background-color: #ff5a5f;
}

.uni-bg-green {
  background-color: #09bb07;
}

.uni-bg-blue {
  background-color: #007aff;
}

.example-body {
  /* #ifndef APP-NVUE */
  display: flex;
  /* #endif */
  flex-direction: row;
  padding: 20rpx;
}

.example-body-item {

  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 15rpx;
  padding: 15rpx;
  height: 60rpx;
  /* #ifndef APP-NVUE */
  display: flex;
  padding: 0 15rpx;
  /* #endif */
  flex: 1;
  border-color: #e5e5e5;
  border-style: solid;
  border-width: 1px;
  border-radius: 5px;
}

.example-body-item-text {
  font-size: 28rpx;
  color: #333;
}

.example-body-dots {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50px;
  background-color: #333333;
  margin-left: 10rpx;
}

.active {
  border-style: solid;
  border-color: #007aff;
  border-width: 1px;
}

.service-card {
  display: flex;
  padding: 24rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.service-img {
  width: 220rpx;
  height: 220rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.title {
  font-size: 38upx;
  font-weight: 900;
  color: #333;
}

.duration-badge {
  margin: 12rpx 0;
}

.sales {
  font-size: 24rpx;
  color: #999;
}

.current-price {
  font-size: 40rpx;
  color: #f40;
}

.original-price {
  line-height:65upx;
  font-size: 20rpx;
  color: #999;
  margin-left: 15rpx;
  text-decoration: line-through;
}
</style>


