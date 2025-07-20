<template>
  <view class="content">
    <!-- 轮播图 -->
    <uni-swiper-dot
        class="uni-swiper-dot-box"
        @clickItem="clickItem"
        :info="banners"
        :current="current"
        :mode="mode"
        :dots-styles="dotsStyles"
        field="content"
    >
      <swiper class="swiper-box" @change="change" :current="swiperDotIndex">
        <swiper-item v-for="(item, index) in banners" :key="index">
          <image style="width: 100%" :src="item.url"></image>
        </swiper-item>
      </swiper>
    </uni-swiper-dot>

    <!-- 模拟项目列表 -->
    <uni-section title="全部项目" type="line">
      <uni-list>
        <view
            class="service-card"
            v-for="item in list"
            :key="item.id"
        >
          <image :src="item.src" class="service-img" mode="aspectFill" />

          <view class="content-wrapper">
            <view class="title">{{ item.name }}</view>

            <view class="duration-badge">
              <uni-badge
                  :text="item.timespan + '分钟'"
                  custom-style="background:#f5f5f5; color:#666; padding:4rpx 16rpx"
              />
            </view>

            <view class="sales">已售{{ item.sells }}份</view>

            <view class="price" style="display: flex">
              <text class="current-price">￥{{ item.price }}</text>
              <text class="original-price">￥{{ item.old_price }}</text>
              <button
                  @click.stop="selectProject(item)"
                  type="default"
                  style="color: white; background-color: #4cd964; height: 60rpx; border-radius: 30rpx; line-height:55rpx"
              >
                详情
              </button>
            </view>
          </view>
        </view>
      </uni-list>
    </uni-section>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const city = ref('上海')
const current = ref(0)
const swiperDotIndex = ref(0)
const mode = ref('default')
const dotsStyles = ref({})

const banners = ref([
  { url: 'https://img.yzcdn.cn/vant/cat.jpeg', content: 'A' },
  { url: 'https://img.yzcdn.cn/vant/cat.jpeg', content: 'B' },
  { url: 'https://img.yzcdn.cn/vant/cat.jpeg', content: 'C' },
])

const list = ref([])

const initMockList = () => {
  list.value = [
    {
      id: 1,
      src: 'https://img.yzcdn.cn/vant/cat.jpeg',
      name: '精油按摩',
      timespan: 60,
      price: 198,
      old_price: 268,
      sells: 120
    },
    {
      id: 2,
      src: 'https://img.yzcdn.cn/vant/cat.jpeg',
      name: '全身理疗',
      timespan: 90,
      price: 288,
      old_price: 358,
      sells: 89
    },
    {
      id: 3,
      src: 'https://img.yzcdn.cn/vant/cat.jpeg',
      name: '足部护理',
      timespan: 45,
      price: 128,
      old_price: 168,
      sells: 143
    }
  ]
}

onMounted(() => {
  initMockList()
})

const change = (e) => {
  current.value = e.detail.current
}

const clickItem = (e) => {
  swiperDotIndex.value = e
}

const selectProject = (item) => {
  uni.navigateTo({
    url: `/pages/jishi/jishi?id=1`
  })
}
</script>

<style scoped lang="scss">
.swiper-box {
  height: 200px;
}

.service-card {
  display: flex;
  padding: 24rpx;
  margin: 20rpx;
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
  font-size: 36rpx;
  font-weight: 600;
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
  font-weight: bold;
}

.original-price {
  line-height: 60rpx;
  font-size: 24rpx;
  color: #999;
  margin-left: 15rpx;
  text-decoration: line-through;
}
</style>
