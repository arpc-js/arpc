import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import vue from '@vitejs/plugin-vue'
import {dsltransform, rpc_proxy} from "./src/core/vite_plugin";
import { createHtmlPlugin } from 'vite-plugin-html'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
// @ts-ignore
export default defineConfig(({ mode }) => {
  const isVue = mode === 'adm'
  const mainEntry = isVue ? '/src/main.vue.ts' : '/src/main.ts'
  return {
    //@ts-ignore
    plugins: [
      isVue ? vue() : uni(),
      rpc_proxy(mode),
      //dsltransform(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      createHtmlPlugin({
        inject: {
          data: {
            mainEntry
          }
        }
      })
    ],
  }
})
