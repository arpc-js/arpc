<template>
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="名称">
          <el-input v-model="obj.name" placeholder="Enter name" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="obj.getPage()">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table :data="obj.list" style="width: 100%">
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="name" label="用户名" />
      <el-table-column prop="path" label="路径" />
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
    <FormDialog
        v-model:visible="showDialog"
        :mode="dialogMode"
        :model="obj"
        :permission-options="permissionOptions"
        @submit="obj.sync"
    />
  </el-card>
  <el-pagination v-model:current-page="obj.page" v-model:page-size="obj.size" :total="obj.total" @current-change="obj.getPage()" background layout="total,prev, pager, next"  />
</template>

<script lang="ts" setup>
import { ref,onMounted } from 'vue';
import {Role} from "../../api/Role.ts";
import {Permission} from "../../api/Permission.ts";
import FormDialog from "../../component/FormDialog.vue";
let obj=new Role()
obj.getPage()


const permissionOptions = ref([]);
const showDialog = ref(false);
// 弹窗模式：add | edit | detail
const dialogMode = ref<'add' | 'edit' | 'detail'>('add');
const dialogTitle = ref('');
// 打开弹窗
function openDialog(mode: 'add' | 'edit' | 'detail', row?: any) {
  dialogMode.value = mode;
  dialogTitle.value = mode === 'add' ? '新增权限' : mode === 'edit' ? '修改权限' : '查看详情';
  if (row) {
    Object.assign(obj, row)
  } else {
    //Object.assign(obj, {})
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
