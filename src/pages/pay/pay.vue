<template>
  <view class="container">
    <!-- 地址输入区域 -->
    <view class="input-section">
<!--      <view class="address-selector" @click="chooseLoc">
        <uni-icons type="location-filled" size="18" color="#007AFF"></uni-icons>
        <text class="selector-text">
          {{ locname || '点击选择位置' }}
        </text>
        <uni-icons type="forward" size="16" color="#666"></uni-icons>
      </view>-->
      <input class="input-item" v-model="address" placeholder="请输入详细地址" />
      <input class="input-item" v-model="phone" placeholder="请输入联系电话" type="number" />
    </view>

    <!-- 商品列表 -->
    <view class="goods-list">
      <view v-for="(item, index) in goodsList" :key="index" class="goods-item">
        <image class="goods-image" :src="item.image" mode="aspectFill"></image>
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <text class="goods-spec">{{ item.spec }}</text>
        </view>
        <view class="goods-right">
          <text class="goods-price">¥{{ item.price }}</text>
          <!--          <text class="goods-quantity">x{{ item.quantity }}</text>-->
        </view>
      </view>
    </view>

    <!-- 车费说明 -->
    <view class="fee-section">
      <view class="fee-item">
        <text>合计</text>
        <text>¥{{ totalPrice }}</text>
      </view>
      <text class="fee-description">请确认正确地址，手机号</text>
    </view>

    <!-- 底部结算栏 -->
    <view class="footer">
      <view class="price-box">
        <text class="total-label">合计：</text>
        <text class="total-price">¥{{ totalPrice }}</text>
      </view>
      <view class="pay-button" @click="handlePay">
        立即支付
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { Order } from "../../arpc/Order"

const instance = getCurrentInstance()
const chatStore = instance?.appContext.config.globalProperties.chatStore

// 模拟商品数据
const goodsList = reactive([
  {
    image: 'https://img.yzcdn.cn/vant/cat.jpeg',
    title: '可爱的小猫咪',
    spec: '颜色: 白色，尺寸: 中号',
    price: 120,
    quantity: 1,
  }
])

// 地址和电话
let locname = ref('')
const address = ref('')
const phone = ref('')
const uname = ref('张三')
const staff_id = ref('123456')
let avatar = ref('')

// 配送费、距离
const deliveryFee = ref(10)  // 默认起步价10元
const distanceKM = ref(0)

// 页面初始化加载模拟数据
onLoad(async () => {
  // 模拟选点
  locname.value = '北京市朝阳区某地'
  address.value = '望京街道36号楼'
  phone.value = '13800138000'
  distanceKM.value = 5  // 5公里
  deliveryFee.value = 10 + 2 * distanceKM.value // 起步价+2元*公里数
})

// 计算总价
const totalPrice = computed(() => {
  const goodsTotal = goodsList.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return (goodsTotal).toFixed(2)
})

// 选择位置事件
const chooseLoc = async () => {
  // 这里用模拟数据，真实项目用 uni.chooseLocation()
  locname.value = '上海市浦东新区'
  distanceKM.value = 3
  deliveryFee.value = 10 + 2 * distanceKM.value
}

// 支付事件
const handlePay = async () => {
  if (!address.value || !phone.value) {
    uni.showToast({
      title: '请填写地址和电话',
      icon: 'none'
    })
    return
  }
  let order = new Order()
  order.staff_id = staff_id.value
  order.name = goodsList.map(i => i.title).join(', ')
  order.total = parseFloat(totalPrice.value)
  order.info = {
    jishi: uname.value,
    name: uni.getStorageSync('name') || '客户',
    locname: locname.value,
    address: address.value,
    phone: phone.value,
    distance: distanceKM.value,
  }
  // 模拟创建订单返回支付参数
  let p = await order.create()
  await uni.requestPayment(p)
  chatStore.send(staff_id.value, '师傅你好，我已下单，请你按时过来')
  uni.redirectTo({ url: '/pages/order/order' })
}
</script>

<style scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.input-section {
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx 0;
  padding: 0 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.input-item {
  height: 100rpx;
  font-size: 28rpx;
  border-bottom: 1rpx solid #eee;
  padding: 20rpx 0;
}

.input-item:last-child {
  border-bottom: none;
}

.goods-list {
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.goods-item {
  display: flex;
  padding: 30rpx;
  align-items: center;
  position: relative;
}

.goods-item::after {
  content: '';
  position: absolute;
  left: 30rpx;
  right: 30rpx;
  bottom: 0;
  height: 1rpx;
  background-color: #f0f0f0;
}

.goods-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.goods-title {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 12rpx;
  font-weight: 500;
}

.goods-spec {
  color: #999;
  font-size: 24rpx;
}

.goods-right {
  min-width: 150rpx;
  text-align: right;
}

.goods-price {
  color: #e4393c;
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.fee-section {
  background: #fff;
  border-radius: 16rpx;
  margin: 20rpx 0;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.fee-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15rpx;
  font-size: 28rpx;
}

.fee-description {
  color: #999;
  font-size: 24rpx;
  display: block;
  margin-top: 10rpx;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
}

.price-box {
  display: flex;
  align-items: baseline;
}

.total-label {
  color: #666;
  font-size: 28rpx;
  margin-right: 10rpx;
}

.total-price {
  color: #e4393c;
  font-size: 36rpx;
  font-weight: bold;
}

.pay-button {
  background: linear-gradient(135deg, #ff5a5f, #e4393c);
  color: #fff;
  padding: 25rpx 60rpx;
  border-radius: 60rpx;
  font-size: 30rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(228, 57, 60, 0.3);
}

.address-selector {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
}

.selector-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  margin: 0 20rpx;
}
</style>
