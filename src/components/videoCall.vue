<template>
  <view>
    <!-- 视频通话容器 -->
    <view v-if="show" class="video-container">
      <!-- 远端视频画面 -->
      <video
          class="remote-video"
          :src="'rtmp://chenmeijia.top:1935/live/stream123'"
          autoplay
          :controls="cont"
          :show-fullscreen-btn="full"
          object-fit="contain"
          :style="{ objectFit: videoFillMode }"
      ></video>

      <!-- 本地预览窗口 -->
      <live-pusher
          id="livePusher"
          ref="livePusher"
          class="local-preview"
          url="rtmp://chenmeijia.top:1935/live/stream123"
          mode="SD"
          :enable-camera="true"
          device-position="back"
          :muted="false"
          :beauty="0"
          aspect="9:21"
          @statechange="statechange"
      ></live-pusher>

      <!-- 底部控制栏 -->
      <view class="control-bar">
        <button class="control-btn accept" @tap="acceptCall">接听</button>
        <button class="control-btn hangup" @tap="hangUp">挂断</button>
      </view>
    </view>

    <!-- 通话触发按钮 -->
    <!--    <button class="call-btn" @click="toggleVideoCall">视频电话</button>-->
  </view>
</template>

<script>
export default {
  data() {
    return {
      full:true,
      cont:false,
      videoFillMode: 'fill', // 可选值：contain / fill / cover
      show: false,
      isConnected: false
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.context = uni.createLivePusherContext("livePusher", this)
          this.switchCamera()
          this.startPush()
        })
      }
    }
  },
  created() {
    console.log(111111111111111)
    this.show=true
  },
  methods: {
    toggleVideoCall() {
      this.show = !this.show
    },

    // 开始推流
    startPush() {
      this.context.start({
        success: () => {
          console.log('推流已启动')
          this.isConnected = true
        }
      })
    },

    // 接听通话
    acceptCall() {
      this.isConnected = true
      uni.showToast({title: '通话已接通', icon: 'none'})
    },

    // 挂断通话
    hangUp() {
      this.context.stop()
      this.show = false
      this.isConnected = false
      uni.showToast({title: '通话已结束', icon: 'none'})
    },

    // 其他原有方法保持不变
    statechange(e) {
      console.log("statechange:", e.detail.code)
    },
    switchCamera() {
      this.context.switchCamera()
    }
  }
}
</script>

<style scoped>
/* 视频容器 */
.video-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  z-index: 999;
}

/* 远端视频 */
.remote-video {
  width: 750rpx;
  height: 70%;
}

/* 本地预览 */
.local-preview {
  position: absolute;
  right: 10rpx;
  width: 240rpx;
  height: 426rpx;
  border-radius: 16rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

/* 控制栏 */
.control-bar {
  position: absolute;
  bottom: 120rpx;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 80rpx;
}

.control-btn {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.control-btn:active {
  transform: scale(0.95);
}

.accept {
  background: #07c160;
}

.hangup {
  background: #ff4444;
}

/* 触发按钮 */
.call-btn {
  position: fixed;
  bottom: 120rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 240rpx;
  background: #07c160;
  color: #fff;
  border-radius: 48rpx;
}
</style>
