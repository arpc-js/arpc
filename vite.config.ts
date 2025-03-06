import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import vue from '@vitejs/plugin-vue'
import {switchIndex,rpc_proxy} from "./src/core/plugin";
// @ts-ignore
export default defineConfig(({ mode }) => {
  // mode 参数即命令行传入的 --mode 值
  return {
    plugins: [uni(),vue,rpc_proxy(),switchIndex(mode)],
  }
})
