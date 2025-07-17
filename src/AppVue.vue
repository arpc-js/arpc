<template>
  <el-container class="layout-container" v-if="!isLoginPage">
    <!-- 侧边菜单 -->
    <el-aside width="200px" class="layout-aside">
      <div class="logo">
        <el-icon class="logo-icon"><HomeFilled /></el-icon>
        <span>ARPC-ADMIN</span>
      </div>
      <el-menu
          class="el-menu-vertical"
          :default-active="activeMenu"
          background-color="#001529"
          text-color="#fff"
          active-text-color="#409EFF"
          @select="handleMenu"
          :unique-opened="true"
      >
        <template v-for="menu in menus" :key="menu.index">
          <el-menu-item v-if="!menu.children" :index="menu.path">
            <el-icon><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </el-menu-item>
          <el-sub-menu v-else :index="menu.index">
            <template #title>
              <el-icon><component :is="menu.icon" /></el-icon>
              <span>{{ menu.title }}</span>
            </template>
            <el-menu-item
                v-for="item in menu.children"
                :key="item.path"
                :index="item.path"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主体 -->
    <el-container>
      <el-header class="layout-header">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item to="/">首页</el-breadcrumb-item>
          <el-breadcrumb-item>{{ currentBreadcrumb }}</el-breadcrumb-item>
        </el-breadcrumb>
        <div class="user-info">
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar size="small" :src="userAvatar" class="avatar" />
              {{ username }} <el-icon><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="modifyPassword">修改密码</el-dropdown-item>
                <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 登录页面 -->
  <router-view v-else />
</template>

<script lang="ts" setup>
import { ref, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { HomeFilled, ArrowDown, User, UserFilled, Lock, Menu, Setting, Tools, Document } from "@element-plus/icons-vue";

// 菜单配置
const menus = [
  {
    index: "1",
    title: "首页",
    icon: HomeFilled,
    path: "/home",
  },
  {
    index: "2",
    title: "系统",
    icon: Setting,
    children: [
      { title: "用户", path: "/user/gets", icon: User },
      { title: "角色", path: "/role/gets", icon: UserFilled },
      { title: "权限", path: "/system/user", icon: Lock },
      { title: "菜单", path: "/menu/gets", icon: Menu },
    ],
  },
  {
    index: "3",
    title: "拓展系统",
    icon: Tools,
    children: [
      { title: "用户", path: "/user/gets1", icon: User },
      { title: "角色", path: "/role/gets1", icon: UserFilled },
      { title: "权限", path: "/system/user1", icon: Lock },
      { title: "菜单", path: "/menu/gets1", icon: Menu },
    ],
  },
  {
    index: "5",
    title: "云对象",
    icon: Document,
    path: "/obj/gets"
  },
];

const route = useRoute();
const router = useRouter();
const activeMenu = ref(route.path);
const isLoginPage = computed(() => route.path === "/login");

const username = ref("admin");
const userAvatar = ref("https://api.dicebear.com/7.x/miniavs/svg?seed=admin"); // 可替换成真实头像

// 监听路由变化高亮菜单
watch(
    () => route.path,
    (newPath) => {
      activeMenu.value = newPath;
    }
);

// 面包屑最后一级
const currentBreadcrumb = computed(() => {
  for (const menu of menus) {
    if (!menu.children && menu.path === route.path) return menu.title;
    if (menu.children) {
      const found = menu.children.find((c) => c.path === route.path);
      if (found) return found.title;
    }
  }
  return "";
});

function handleMenu(path: string) {
  router.push(path);
}

function logout() {
  localStorage.removeItem('token');
  router.push("/login");
}

function modifyPassword() {
  alert("打开修改密码弹窗（需实现）");
}
</script>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.layout-container {
  height: 100vh;
  display: flex;
}

.layout-aside {
  background-color: #001529;
  color: #fff;
  height: 100vh;
  overflow-y: auto;
  flex-shrink: 0;
  padding: 0;
  box-sizing: border-box;
}

.el-menu-vertical {
  background-color: transparent !important;
}

.logo {
  height: 60px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  display: flex;
  align-items: center;
  padding-left: 20px;
  background: #001529;
  border-bottom: 1px solid #0a1b2a;
}

.logo-icon {
  margin-right: 10px;
  color: #409EFF;
}

.layout-header {
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.user-info {
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
}

.el-dropdown-link {
  cursor: pointer;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
}

.avatar {
  vertical-align: middle;
  margin-right: 8px;
}

.el-container > .el-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

.layout-main {
  background: #f5f7fa;
  padding: 5px !important;
  overflow: auto;
  height: calc(100vh - 60px);

  scrollbar-width: none;
  -ms-overflow-style: none;
}

.layout-main::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.el-pagination {
  position: fixed;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
</style>
