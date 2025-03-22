<template>
  <view class="container">
    <!-- 地址输入区域 -->
    <view class="input-section">
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
          <text class="goods-quantity">x{{ item.quantity }}</text>
        </view>
      </view>
    </view>

    <!-- 车费说明 -->
    <view class="fee-section">
      <view class="fee-item">
        <text>距离</text>
        <text>{{ distanceKM }}km</text>
      </view>
      <view class="fee-item">
        <text>车费</text>
        <text>¥{{ deliveryFee }}</text>
      </view>
      <text class="fee-description">起步价10元，一公里2元</text>
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
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app';
import {Order} from "../../api/Order";
// 商品数据
const goodsList = reactive([
  {
    image: '/static/logo.png',
    title: '精油开背',
    spec: '规格：500g',
    price: 25.8,
    quantity: 1
  }
])
// 地址和电话
const address = ref('')
const phone = ref('')
// 配送费
const deliveryFee = ref(1.0)
const distanceKM = ref(0)
onLoad((opt) => {
  goodsList[0].title=opt.project
  goodsList[0].price=opt.price
  console.log(opt.id);  // 输出 URL 参数
  distanceKM.value =opt.distance
  //deliveryFee.value=deliveryFee.value+0.2*distanceKM.value
  deliveryFee.value.toFixed(2)
});

// 计算总价
const totalPrice = computed(() => {
  const goodsTotal = goodsList.reduce((sum, item) => {
    return sum + item.price * item.quantity
  }, 0)
  return (goodsTotal + deliveryFee.value).toFixed(2)
})

// 支付处理
const handlePay =async () => {
  if (!address.value || !phone.value) {
    uni.showToast({
      title: '请填写地址和电话',
      icon: 'none'
    })
    return
  }
  let order = new Order()
  order.name = goodsList[0].title
  order.total = parseFloat(totalPrice.value)
  order.info={
    address:address.value,
    phone:phone.value,
    distance:distanceKM.value,
  }
  let p = await order.create()
  await uni.requestPayment(p);
/*  uni.showModal({
    title: '支付确认',
    content: `确认支付 ¥${totalPrice.value} 元吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '支付成功',
          icon: 'success'
        })
      }
    }
  })*/
}
function getDistance(lng1,lat1, lng2,lat2, unit = 'K') {
  // 角度转弧度
  const rad = (degree) => degree * Math.PI / 180;

  const radLat1 = rad(lat1);
  const radLat2 = rad(lat2);
  const deltaLat = radLat2 - radLat1;
  const deltaLng = rad(lng2) - rad(lng1);

  // Haversine公式计算
  const a = Math.sin(deltaLat/2)**2
      + Math.cos(radLat1) * Math.cos(radLat2)
      * Math.sin(deltaLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  // 地球半径（单位：千米）
  const R = 6371;
  let distance = R * c;

  // 单位转换
  switch(unit.toUpperCase()) {
    case 'M': // 米
      distance *= 1000;
      break;
    case 'N': // 海里
      distance *= 0.5399568;
      break;
  }

  return distance;
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

.goods-quantity {
  color: #666;
  font-size: 26rpx;
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
</style>
