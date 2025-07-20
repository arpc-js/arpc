<template>
  <view class="page">
    <!-- 轮播图 -->
    <swiper
        class="swiper"
        indicator-dots
        indicator-color="#f5f5f5"
        indicator-active-color="#ff4a4a"
        autoplay
        interval="4000"
        circular
    >
      <swiper-item v-for="(img, idx) in product.images" :key="idx">
        <image :src="img" class="swiper-image" mode="aspectFill"></image>
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="product-title">{{ product.title }}</view>

      <view class="price-row">
        <text class="current-price">¥{{ product.price.toFixed(2) }}</text>
        <text class="original-price">¥{{ product.oldPrice.toFixed(2) }}</text>
        <view class="promo-tag">拼团价</view>
      </view>

      <view class="stock-info">库存 {{ product.stock }} 件</view>
    </view>

    <!-- 规格选择 -->
    <view class="spec-section">
      <view class="spec-title">选择规格</view>
      <view class="spec-list">
        <view
            v-for="spec in product.specs"
            :key="spec.id"
            :class="['spec-item', selectedSpec.id === spec.id ? 'selected' : '']"
            @click="selectSpec(spec)"
        >
          {{ spec.name }}
        </view>
      </view>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section">
      <view class="detail-title">商品详情</view>
      <view class="detail-content" v-html="product.detailHtml"></view>
    </view>

    <!-- 底部购买栏 -->
    <view class="footer-bar">
      <view class="quantity-selector">
        <button class="qty-btn" @click="decreaseQty" :disabled="quantity <= 1">-</button>
        <input class="qty-input" type="number" v-model.number="quantity" />
        <button class="qty-btn" @click="increaseQty" :disabled="quantity >= product.stock">+</button>
      </view>
      <button class="buy-btn" @click="goToPay">立即购买</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const product = {
  id: 1,
  title: '高品质智能手机2025款',
  price: 2599.99,
  oldPrice: 2999.99,
  stock: 58,
  images: [
    'https://img.yzcdn.cn/vant/cat.jpeg',
    'https://img.yzcdn.cn/vant/cat2.jpeg',
    'https://img.yzcdn.cn/vant/cat3.jpeg',
  ],
  specs: [
    { id: 1, name: '黑色' },
    { id: 2, name: '白色' },
    { id: 3, name: '蓝色' },
  ],
  detailHtml: `
    <p>这款智能手机配备超高清摄像头，性能强劲，外观时尚，适合各种场合使用。</p>
    <p>支持5G网络，续航持久，屏幕显示细腻，是您理想的选择。</p>
    <img src="https://img.yzcdn.cn/vant/cat.jpeg" style="width:100%; margin-top:12rpx; border-radius:8rpx;" />
  `,
}

const selectedSpec = ref(product.specs[0])
const quantity = ref(1)

const selectSpec = (spec) => {
  selectedSpec.value = spec
}

const increaseQty = () => {
  if (quantity.value < product.stock) quantity.value++
}
const decreaseQty = () => {
  if (quantity.value > 1) quantity.value--
}

const goToPay = () => {
  uni.navigateTo({
    url: `/pages/pay/pay?id=1`
  })
}
</script>

<style scoped>
.page {
  background: #fff;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 110rpx; /* 底部栏高度 */
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.swiper {
  height: 360rpx;
  background: #fff;
  border-bottom-left-radius: 16rpx;
  border-bottom-right-radius: 16rpx;
  overflow: hidden;
}

.swiper-image {
  width: 100%;
  height: 360rpx;
}

.product-info {
  padding: 28rpx 24rpx 20rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.product-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #222;
  line-height: 48rpx;
  margin-bottom: 22rpx;
}

.price-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 10rpx;
}

.current-price {
  font-size: 42rpx;
  color: #ff3b30;
  font-weight: 900;
  letter-spacing: 0.5rpx;
}

.original-price {
  font-size: 28rpx;
  color: #999;
  text-decoration: line-through;
}

.promo-tag {
  background: #ff3b30;
  color: #fff;
  font-size: 24rpx;
  padding: 6rpx 22rpx;
  border-radius: 20rpx;
  font-weight: 700;
  user-select: none;
}

.stock-info {
  font-size: 26rpx;
  color: #888;
  margin-top: 6rpx;
}

.spec-section {
  padding: 28rpx 24rpx 22rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.spec-title {
  font-weight: 700;
  font-size: 30rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.spec-list {
  display: flex;
  gap: 18rpx;
  flex-wrap: wrap;
}

.spec-item {
  border: 2rpx solid #e1e1e1;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  color: #555;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
}

.spec-item.selected {
  border-color: #ff3b30;
  color: #ff3b30;
  font-weight: 700;
  background: #ffe7e5;
}

.detail-section {
  padding: 24rpx;
  background: #fff;
}

.detail-title {
  font-weight: 700;
  font-size: 32rpx;
  color: #222;
  margin-bottom: 18rpx;
}

.detail-content p {
  font-size: 26rpx;
  line-height: 38rpx;
  color: #444;
  margin-bottom: 16rpx;
}

.detail-content img {
  border-radius: 12rpx;
  margin-top: 10rpx;
  width: 100%;
  display: block;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110rpx;
  background: #fff;
  box-shadow: 0 -8rpx 16rpx rgba(255, 59, 48, 0.35);
  display: flex;
  align-items: center;
  padding: 0 28rpx;
  gap: 20rpx;
  z-index: 100;
}

.quantity-selector {
  display: flex;
  align-items: center;
  border: 2rpx solid #ff3b30;
  border-radius: 48rpx;
  overflow: hidden;
  height: 62rpx;
  width: 160rpx;
}

.qty-btn {
  width: 50rpx;
  font-size: 42rpx;
  color: #ff3b30;
  background: none;
  border: none;
  cursor: pointer;
  user-select: none;
  line-height: 62rpx;
  font-weight: 900;
  transition: color 0.3s ease;
}

.qty-btn:disabled {
  color: #ffc1bb;
  cursor: not-allowed;
}

.qty-input {
  flex: 1;
  height: 100%;
  text-align: center;
  font-size: 28rpx;
  border: none;
  outline: none;
  color: #333;
  font-weight: 700;
  user-select: none;
}

.buy-btn {
  flex: 1;
  height: 62rpx;
  background-color: #ff3b30;
  border-radius: 48rpx;
  color: white;
  font-size: 32rpx;
  font-weight: 700;
  text-align: center;
  line-height: 62rpx;
  user-select: none;
  box-shadow: 0 4rpx 14rpx rgba(255, 59, 48, 0.8);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.buy-btn:hover {
  background-color: #e0352a;
}
</style>
