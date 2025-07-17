<template>
  <view class="content">
    <uni-section title="我的订单" type="line">
      <uni-list>
        <view class="order-card" v-for="(item, index) in list" :key="index">
          <view class="order-header">
            <text class="order-title">{{item.name}}</text>
            <text class="order-status" :class="item.status === 1 ? 'paid' : 'unpaid'">
              {{item.status === 1 ? '已支付' : '未支付'}}
            </text>
          </view>

          <view class="order-details">
            <view class="detail-item">
              <text class="detail-label">订单金额：</text>
              <text class="detail-value price">¥{{item.total}}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">技师：</text>
              <text class="detail-value price">{{item?.info?.jishi}}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">顾客：</text>
              <text class="detail-value price">{{item?.info?.name}}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">地址：</text>
              <text class="detail-value price">{{item?.info?.locname}}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">详细地址：</text>
              <text class="detail-value price">{{item?.info?.address}}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">电话：</text>
              <text class="detail-value price">{{item?.info?.phone}}</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">距离：</text>
              <text class="detail-value price">{{item?.info?.distance}}km</text>
            </view>
            <view class="detail-item">
              <text class="detail-label">创建时间：</text>
              <text class="detail-value time">{{formatTime(item.created_at)}}</text>
            </view>
          </view>

          <view class="order-actions" v-if="item.status === 0">
            <button class="action-btn pay-btn" @click="pay">立即支付</button>
          </view>
        </view>
      </uni-list>
    </uni-section>
  </view>
</template>

<script>
import { Order } from "../../arpc/Order";

export default {
  data() {
    return {
      list: []
    }
  },
  async onLoad() {
    const order = new Order()
    if (uni.getStorageSync('type')==1){
      this.list = await order.getByStaffId(uni.getStorageSync('uid'))
    }else{
      this.list = await order.getByUid(uni.getStorageSync('uid'))
    }
  },
  methods: {
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}`
    },
    async pay() {
      // 支付逻辑
    }
  }
}
</script>

<style lang="scss">
.order-card {
  padding: 24rpx;
  margin: 20rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid #eee;

    .order-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }

    .order-status {
      font-size: 28rpx;
      padding: 8rpx 16rpx;
      border-radius: 24rpx;

      &.paid {
        color: #4cd964;
        background: #eaffeb;
      }

      &.unpaid {
        color: #ff3b30;
        background: #ffeaea;
      }
    }
  }

  .order-details {
    padding: 20rpx 0;

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 16rpx 0;

      .detail-label {
        font-size: 28rpx;
        color: #666;
      }

      .detail-value {
        font-size: 28rpx;
        color: #333;

        &.price {
          color: #ff7900;
          font-weight: 600;
        }

        &.time {
          color: #999;
        }
      }
    }
  }

  .order-actions {
    padding-top: 20rpx;
    border-top: 1rpx solid #eee;

    .action-btn {
      height: 72rpx;
      line-height: 72rpx;
      border-radius: 36rpx;
      font-size: 28rpx;
      margin: 0;

      &.pay-btn {
        background: linear-gradient(90deg, #00c6ff, #0072ff);
        color: white;
        border: none;
      }
    }
  }
}
</style>
