
<template>
  {{obj.menus}}
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
      <el-form :inline="true" class="filter-form">

        <el-form-item label="名称">
          <el-input v-model="obj.name" placeholder="请输入名称" clearable />
        </el-form-item>

        <el-form-item label="菜单">
          <el-select v-model="obj.menus" clearable placeholder="请选择菜单">

          </el-select>
        </el-form-item>

        <el-form-item label="用户">
          <el-input v-model="obj.users" placeholder="请输入用户" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="obj.getPage()">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 表格区域 -->
    <el-table :data="obj.list" style="width: 100%">
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="menus" label="菜单" />
      <el-table-column prop="users" label="用户" />
      <el-table-column label="操作" width="240">
        <template #header>
          <el-button size="small" @click="openDialog('add')">新增</el-button>
        </template>
        <template #default="scope">
          <el-button size="small" @click="openDialog('detail', scope.row)">详情</el-button>
          <el-button size="small" @click="openDialog('edit', scope.row)">修改</el-button>
          <el-button size="small" type="danger" @click="obj.del(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 弹窗：新增/修改/详情 -->
    <el-dialog :title="dialogTitle" v-model="showDialog" width="400px" @close="obj.reset()">
      <el-form :model="obj">

        <el-form-item label="名称" prop="name">
          <el-input v-model="obj.name" />
        </el-form-item>

        <el-form-item label="菜单" prop="menus">
          <el-select v-model="obj.menus" multiple value-key="id">
            <el-option v-for="item in obj.menus_sel" :key="item.id" :label="item.name" :value="item" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
        <el-button type="primary" v-if="dialogMode !== 'detail'" @click="obj.cover().then(() => showDialog = false)">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
  <el-pagination v-model:current-page="obj.page" v-model:page-size="obj.size" :total="obj.total" @current-change="obj.getPage()" background layout="total,prev, pager, next"  />
</template>

<script lang="ts" setup>
import { ref,onMounted } from 'vue';

import {Role} from "../../api/Role.ts";
import {Menu} from "../../api/Menu.ts";
let obj=new Role()
obj.sel('id','name',Menu.sel('id','name')).getPage()
onMounted(async () => {
  console.log('sel'.endsWith('_sel'))
  console.log('页面加载完成，执行函数')
})
const showDialog = ref(false);
const dialogMode = ref<'add' | 'edit' | 'detail'>('add')
const dialogTitle = ref('')
//@ts-ignore
async function openDialog(mode, row=undefined) {
  dialogMode.value = mode;
  dialogTitle.value = mode === 'add' ? '新增' : mode === 'edit' ? '修改' : '查看详情';
  if (row) {
    Object.assign(obj, row)
    obj.menus_sel = await Menu.sel('*').get()
  } else {
    obj.menus_sel = await Menu.sel('*').get()
  }
  showDialog.value = true;
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
