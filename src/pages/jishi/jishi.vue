<template>
  <view class="content">
    <!-- 新增搜索栏 -->
    <view class="search-bar">
      <view class="city-tag">
        <text class="city-text">{{ city || '定位中...' }}</text>
        <uni-icons type="location-filled" size="16" color="#4cd964"></uni-icons>
      </view>
      <input
          class="search-input"
          v-model="searchName"
          placeholder="输入师傅名称"
          @confirm="search"
      />
      <button
          class="search-btn"
          @click="search"
      >搜索</button>
    </view>
    <uni-section title="选择工人" type="line">
      <uni-list>
        <view class="service-card" v-for="(item, index) in list">
          <image :src="item.avatar"
                 class="service-img"
                 mode="aspectFill"></image>
          <view class="content-wrapper">
            <view class="title">{{ item.name }}</view>
            <view class="duration-badge">
              <uni-badge :text="item.city" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
              <uni-badge text="6年经验" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
              <uni-badge text="29岁" custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"/>
            </view>
            <view class="price" style="display: flex">
              <text class="original-price">{{item.distance}}km</text>
              <!--              <text class="original-price">34好评</text>-->
              <button
                  @click="to(`/pages/pay/pay?id=${item.id}&name=${item.name}&project=${this.poject}&price=${this.price}&distance=${item.distance}&src=${this.src}&avatar=${encodeURIComponent(item.avatar)}`)"
                  type="default"
                  style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">下单
              </button>
              <button @click="to(`/pages/chat/chat?id=${item.id}&name=${item.name}&avatar=${encodeURIComponent(item.avatar)}`)" type="default"
                      style="color: white;background-color: #4cd964;height: 60rpx;border-radius: 30rpx;line-height:55rpx">
                聊天
              </button>
            </view>
          </view>
        </view>
      </uni-list>
    </uni-section>
  </view>
</template>
<script>
import {User} from "../../arpc/User";
import {Order} from "../../arpc/Order";

export default {
  components: {},
  data() {
    return {
      city: '', // 当前城市
      searchName: '', // 新增搜索关键词
      originalList: [], // 新增原始数据备份
      distance: 0,
      src: '',
      poject: '',
      price: 0,
      list: [],
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
  async onLoad({id, name, price,src}) {
    this.city=uni.getStorageSync('city')
    this.poject = name
    this.price = price
    this.src = src
    let u = new User()
    this.list = await u.getByType(1)
    let loc=uni.getStorageSync('loc')
    this.list.forEach(x=>{
      x.distance=this.getDistance(loc.longitude, loc.latitude, x.location.longitude, x.location.latitude)
      x.distance=x.distance.toFixed(1)
    })
    this.originalList = [...this.list] // 保存原始数
  },
  methods: {
    async search() {
      let u = new User()
      this.list = await u.getByType(1,this.searchName)
      let loc=uni.getStorageSync('loc')
      this.list.forEach(x=>{
        x.distance=this.getDistance(loc.longitude, loc.latitude, x.location.longitude, x.location.latitude)
        x.distance=x.distance.toFixed(1)
      })
    },
    async pay() {
      //打开微信收银台
      let order = new Order()
      order.name = this.poject
      order.total = this.price
      let p = await order.create()
      await uni.requestPayment(p);
    },
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
    },
    getDistance(lng1, lat1, lng2, lat2, unit = 'K') {
      // 角度转弧度
      const rad = (degree) => degree * Math.PI / 180;
      const radLat1 = rad(lat1);
      const radLat2 = rad(lat2);
      const deltaLat = radLat2 - radLat1;
      const deltaLng = rad(lng2) - rad(lng1);
      // Haversine公式计算
      const a = Math.sin(deltaLat / 2) ** 2
          + Math.cos(radLat1) * Math.cos(radLat2)
          * Math.sin(deltaLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      // 地球半径（单位：千米）
      const R = 6371;
      let distance = R * c;
      // 单位转换
      switch (unit.toUpperCase()) {
        case 'M': // 米
          distance *= 1000;
          break;
        case 'N': // 海里
          distance *= 0.5399568;
          break;
      }
      return distance;
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
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
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
  line-height: 65rpx;
  font-size: 20rpx;
  color: #999;
  margin-left: 15rpx;
}
/* 新增搜索栏样式 */
.search-bar {
  display: flex;
  padding: 20rpx 30rpx;
  background: #fff;
  gap: 15rpx;
  align-items: center;
  border-bottom: 1rpx solid #eee;

  .city-tag {
    display: flex;
    align-items: center;
    padding: 0 20rpx;
    height: 70rpx;
    background: #f5f5f5;
    border-radius: 35rpx;
    .city-text {
      font-size: 28rpx;
      color: #666;
      margin-right: 10rpx;
    }
    uni-icons {
      margin-top: 2rpx;
    }
  }

  .search-input {
    flex: 1;
    height: 70rpx;
    padding: 0 30rpx;
    background: #f5f5f5;
    border-radius: 35rpx;
    font-size: 28rpx;
    color: #333;
  }

  .search-btn {
    background: #4cd964;
    color: #fff;
    height: 70rpx;
    line-height: 70rpx;
    padding: 0 40rpx;
    border-radius: 35rpx;
    font-size: 28rpx;
    margin: 0;
    transition: all 0.3s;

    &::after {
      border: none;
    }

    &:active {
      background: #3ac852;
      transform: scale(0.98);
    }
  }
}
</style>


