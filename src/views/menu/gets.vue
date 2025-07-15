
<template>
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
  <el-form :inline="true" class="filter-form">
    
      <el-form-item label="名称">
        <el-input v-model="obj.name" placeholder="请输入名称" clearable />
      </el-form-item>

      <el-form-item label="上级id">
        <el-input v-model="obj.parent_id" placeholder="请输入上级id" clearable />
      </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="obj.getPage()">查询</el-button>
    </el-form-item>
  </el-form>
</div>
    <!-- 表格区域 -->
    <el-table :data="obj.list" style="width: 100%">
  <el-table-column prop="name" label="名称" />
  <el-table-column prop="parent_id" label="上级id" />
  <el-table-column prop="path" label="路径" />
  <el-table-column prop="icon" label="图标" />
  <el-table-column prop="index" label="排序" />
  <el-table-column prop="roles" label="角色" />
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
    <el-dialog :title="dialogTitle" v-model="showDialog" width="1000px" @close="obj.reset()">
    <el-form :model="obj">

  <el-form-item label="名称" prop="name">
    <el-input v-model="obj.name" />
  </el-form-item>

  <el-form-item label="上级id" prop="parent_id">
    <el-input v-model="obj.parent_id" />
  </el-form-item>

  <el-form-item label="路径" prop="path">
    <el-input v-model="obj.path" />
  </el-form-item>

  <el-form-item label="图标" prop="icon">
    <el-input v-model="obj.icon" />
  </el-form-item>

  <el-form-item label="排序" prop="index">
    <el-input v-model="obj.index" />
  </el-form-item>
</el-form>
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
        <el-button type="primary" v-if="dialogMode !== 'detail'" @click="obj.sync().then(() => showDialog = false)">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
  <el-pagination v-model:current-page="obj.page" v-model:page-size="obj.size" :total="obj.total" @current-change="obj.getPage()" background layout="total,prev, pager, next"  />
</template>

<script lang="ts" setup>
import { ref,onMounted } from 'vue';

import {Menu} from "../../api/Menu.ts";
let obj=new Menu()
obj.getPage()
onMounted(async () => {
  console.log('页面加载完成，执行函数')
})
const showDialog = ref(false);
const dialogMode = ref<'add' | 'edit' | 'detail'>('add')
const dialogTitle = ref('')
//@ts-ignore
function openDialog(mode, row) {
  dialogMode.value = mode;
  dialogTitle.value = mode === 'add' ? '新增' : mode === 'edit' ? '修改' : '查看详情';
  if (row) {
    Object.assign(obj, row)
  } else {
    Object.assign(obj, {})
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
