<template>
  <div>
    <el-container v-if="!isLoginPage" style="height: 100vh">
      <el-aside width="200px">
        <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical-demo"
            @select="handleMenu"
        >
          <template v-for="(menu) in menus" :key="menu.index">
            <el-sub-menu :index="menu.index">
              <template #title>
                <el-icon>
                  <component :is="menu.icon" />
                </el-icon>
                <span>{{ menu.title }}</span>
              </template>
              <el-menu-item
                  v-for="item in menu.children"
                  :key="item.path"
                  :index="item.path"
              >
                <el-icon>
                  <component :is="item.icon" />
                </el-icon>
                <span>{{ item.title }}</span>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-aside>

      <el-container>
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>

    <router-view v-else />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const menus = [
  {
    index: '1',
    title: '系统',
    icon: 'Setting',
    children: [
      { title: '用户', path: '/user/gets', icon: 'Avatar' },
      { title: '角色', path: '/system/role', icon: 'UserFilled' },
      { title: '权限', path: '/system/user', icon: 'User' },
      { title: '菜单', path: '/system/role', icon: 'UserFilled' }
    ]
  },
  {
    index: '2',
    title: '内容管理',
    icon: 'Document',
    children: [
      { title: '文章列表', path: '/content/articles', icon: 'DocumentCopy' }
    ]
  },
  {
    index: '3',
    title: '内容管理',
    icon: 'Document',
    children: [
      { title: '文章列表', path: '/content/articles', icon: 'DocumentCopy' }
    ]
  },
  {
    index: '4',
    title: '内容管理',
    icon: 'Document',
    children: [
      { title: '文章列表', path: '/content/articles', icon: 'DocumentCopy' }
    ]
  },
  {
    index: '5',
    title: '云对象',
    icon: 'Document',
    children: [
      { title: '云对象', path: '/obj/gets', icon: 'DocumentCopy' },
    ]
  }
]

const route = useRoute()
const router = useRouter()
const activeMenu = ref(route.path)
const isLoginPage = computed(() => route.path === '/user/login')

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})

function handleMenu(path: string) {
  router.push(path)
}
</script>

<style>
.el-pagination {
  position: fixed;
  bottom: 75px;
  left: 55%;
  transform: translateX(-50%);
  z-index: 100;
}
</style>
