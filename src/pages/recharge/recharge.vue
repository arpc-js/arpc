<template>
  <view class="container">
    <!-- 标题栏 -->
    <view class="header">
      <text class="title">充值</text>
    </view>

    <!-- 金额输入 -->
    <view class="balance-container">
      <text class="balance-label">充值金额（元）</text>
      <view class="input-container">
        <text class="currency-symbol">¥</text>
        <input
            class="amount-input"
            type="number"
            v-model="inputAmount"
            placeholder="请输入充值金额"
            placeholder-class="placeholder-style"
            focus
        />
      </view>
    </view>

    <!-- 充值按钮 -->
    <view class="footer">
      <button
          class="recharge-btn"
          @click="handleRecharge"
      >
        立即充值
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import {Order} from "../../api/Order";
import {User} from "../../api/User";

const inputAmount = ref(''); // 输入的金额

const handleRecharge =async () => {
  if (!inputAmount.value) {
    uni.showToast({
      title: '请输入金额',
      icon: 'none'
    });
    return;
  }
  //打开微信收银台
  let order=new Order()
  order.name=`充值￥${inputAmount.value}`
  order.total=inputAmount.value
  let p=await order.create('cbRecharge')
  await uni.requestPayment(p);


  uni.reLaunch({  url: '/pages/me/me' })
  return


  const amount = parseFloat(inputAmount.value);
  if (isNaN(amount) || amount <= 0) {
    uni.showToast({
      title: '金额不合法',
      icon: 'none'
    });
    return;
  }

  // 调用支付接口
  uni.showLoading({ title: '支付中...' });
  setTimeout(() => {
    uni.hideLoading();
    uni.showToast({
      title: `成功充值¥${amount}`,
      icon: 'success'
    });
    inputAmount.value = '';
  }, 1500);
};
</script>

<style lang="scss">
.container {
  height: 100vh;
  background-color: #f8f8f8;
  position: relative;
}

.header {
  height: 88rpx;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1rpx solid #eee;

  .title {
    font-size: 36rpx;
    font-weight: 500;
    color: #333;
  }
}

.balance-container {
  margin: 40rpx 32rpx;
  padding: 40rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);

  .balance-label {
    font-size: 28rpx;
    color: #999;
    display: block;
    margin-bottom: 40rpx;
  }

  .input-container {
    display: flex;
    align-items: center;
    border-bottom: 2rpx solid #07c160;
    padding-bottom: 20rpx;

    .currency-symbol {
      font-size: 64rpx;
      color: #333;
      font-weight: 600;
      margin-right: 20rpx;
    }

    .amount-input {
      flex: 1;
      font-size: 64rpx;
      color: #333;
      height: 90rpx;
      font-weight: 600;
    }

    .placeholder-style {
      color: #ccc;
      font-size: 56rpx;
    }
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  background: #fff;
  border-top: 1rpx solid #eee;

  .recharge-btn {
    background: #07c160;
    color: #fff;
    border-radius: 48rpx;
    height: 96rpx;
    line-height: 96rpx;
    font-size: 34rpx;
    transition: opacity 0.3s;

    &:active {
      opacity: 0.8;
    }

    &::after {
      border: none;
    }
  }
}
</style>
