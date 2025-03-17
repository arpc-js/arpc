<template>
  <view class="content">
    <uni-section title="选择工人" type="line">
      <uni-list>
        <view class="service-card">
          <image src="https://wx2.sinaimg.cn/mw690/007JHMfMgy1hyel2iby2lj30sg0sgtbo.jpg"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">水电工小张</view>
            <view class="duration-badge">
              <uni-badge text="6年经验" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
              <uni-badge text="29岁" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>
            <view class="price" style="display: flex">
              <text class="original-price">100人关注</text>
              <text class="original-price">34好评</text>
              <button @click="to(`/pages/chat/chat?id=1`)" type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">立即聊天</button>
            </view>
          </view>
        </view>
        <view class="service-card">
          <image src="https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fsafe-img.xhscdn.com%2Fbw1%2F531f429d-7666-4b23-92ce-bed776ae7719%3FimageView2%2F2%2Fw%2F1080%2Fformat%2Fjpg&refer=http%3A%2F%2Fsafe-img.xhscdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1743930305&t=89ac999fe39c9259ca660d30ec5a02dc"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">抹灰小王</view>
            <view class="duration-badge">
              <uni-badge text="6年经验" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
              <uni-badge text="29岁" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>
            <view class="price" style="display: flex">
              <text class="original-price">100人关注</text>
              <text class="original-price">34好评</text>
              <button @click="to(`/pages/chat/chat?id=2`)" type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">立即聊天</button>
            </view>
          </view>
        </view>
        <view class="service-card">
          <image src="https://ww1.sinaimg.cn/mw690/c4877746ly1hsxzy9qflcj20sq0sq7a1.jpg"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">贴砖小李</view>
            <view class="duration-badge">
              <uni-badge text="6年经验" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
              <uni-badge text="29岁" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>
            <view class="price" style="display: flex">
              <text class="original-price">100人关注</text>
              <text class="original-price">34好评</text>
              <button type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">立即聊天</button>
            </view>
          </view>
        </view>
        <view class="service-card">
          <image src="https://wx3.sinaimg.cn/mw690/006i0nC8ly1hquk6owrwoj31o01o0qs9.jpg"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">木匠小王</view>
            <view class="duration-badge">
              <uni-badge text="6年" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
              <uni-badge text="29岁" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>
            <view class="price" style="display: flex">
              <text class="original-price">100人关注</text>
              <text class="original-price">34好评</text>
              <button type="default" style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">立即聊天</button>
            </view>
          </view>
        </view>
      </uni-list>
    </uni-section>
  </view>
</template>
<script>
export default {
  components: {},
  data() {
    return {
      info: [{
        colorClass: 'uni-bg-red',
        url: 'https://pic.rmb.bdstatic.com/bjh/news/db6e8c9afebaa4ed7bf43557189f6b175625.png',
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
  onLoad(opt) {},
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
  font-size: 38rpx;
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
  line-height:65rpx;
  font-size: 20rpx;
  color: #999;
  margin-left: 15rpx;}
</style>


