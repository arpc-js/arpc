
<template>
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
  <el-form :inline="true" class="filter-form">
    
    <el-form-item>
      <el-button type="primary" @click="obj.getPage()">查询</el-button>
    </el-form-item>
  </el-form>
</div>
    <!-- 表格区域 -->
    <el-table :data="obj.list" style="width: 100%">
  <el-table-column prop="name" label="name" />
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

  <el-form-item label="name" prop="name">
    <el-input v-model="obj.name" />
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

import {Test1} from "../../arpc/Test1.ts";
let obj=new Test1()
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
