import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import vue from '@vitejs/plugin-vue'
import {dsltransform, arpc_cli} from "./src/core/vite_plugin";
import { createHtmlPlugin } from 'vite-plugin-html'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import {interceptor} from "./src/utils/interceptor.ts";
// @ts-ignore
export default defineConfig(({ mode }) => {
  const isVue = mode === 'adm'
  const mainEntry = isVue ? '/src/main.vue.ts' : '/src/main.ts'
  let vue_plugins=[
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ]
let uni_plugins=[uni()]
  return {
    //@ts-ignore
    plugins: [
        ...isVue?vue_plugins:uni_plugins,
      arpc_cli({
        mode,
        rpc_dir: '/src/arpc',
        base_url: 'http://127.0.0.1',
        vue_401: '/login',
        uni_401: '/pages/login/login',
        interceptor
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
