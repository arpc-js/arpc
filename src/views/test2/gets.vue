<template>
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
  <el-form :inline="true" class="filter-form">
    
      <el-form-item label="名称">
        <el-input v-model="obj.name" placeholder="请输入名称" clearable />
      </el-form-item>
    <el-form-item>
      <el-button type="primary" icon="Search" @click="obj.getPage()">查询</el-button>
      <el-button type="primary" icon="Refresh" @click="obj.reset()">重置</el-button>
    </el-form-item>
  </el-form>
</div>
    <!-- 表格区域 -->
    <el-table border :data="obj.list" style="width: 100%">
  <el-table-column prop="name" label="名称" />
  <el-table-column prop="roles" label="roles" />
<el-table-column label="操作" width="240" align="right">
        <!-- 表头插槽替代label，显示“操作” + 新增按钮 -->
        <template #header>
          <div style="display:flex; align-items:center; justify-content:flex-end; gap: 8px;">
            <el-button
                size="mini"
                type="primary"
                icon="Plus"
                @click="openDialog('add')"
            >新增</el-button>
          </div>
        </template>
    <template #default="scope">
      <el-button icon="View" circle size="small" @click="openDialog('detail', scope.row)"/>
      <el-button icon="Edit" circle size="small" type="primary" @click="openDialog('edit', scope.row)"/>
      <el-button icon="Delete" circle size="small" type="danger" @click="obj.del(scope.row.id)"/>
    </template>
  </el-table-column>
</el-table>
    <!-- 弹窗：新增/修改/详情 -->
    <el-dialog :title="dialogTitle" v-model="showDialog" width="1000px" @close="obj.reset()">
    <el-form :model="obj">

  <el-form-item label="名称" prop="name">
    <el-input v-model="obj.name" />
  </el-form-item>

  <el-form-item label="roles" prop="roles">
    <el-table :data="obj.roles" style="width: 100%">
      
      <el-table-column label="名称" prop="name">
        <template #default="scope">
          <el-input v-model="scope.row.name" placeholder="请输入" />
        </template>
      </el-table-column>

      <el-table-column label="菜单" prop="menus">
        <template #default="scope">
          <el-input v-model="scope.row.menus" placeholder="请输入" />
        </template>
      </el-table-column>

      <el-table-column label="用户" prop="users">
        <template #default="scope">
          <el-input v-model="scope.row.users" placeholder="请输入" />
        </template>
      </el-table-column>

      <el-table-column label="用户" prop="permissions">
        <template #default="scope">
          <el-input v-model="scope.row.permissions" placeholder="请输入" />
        </template>
      </el-table-column>

      <el-table-column label="test2s" prop="test2s">
        <template #default="scope">
          <el-input v-model="scope.row.test2s" placeholder="请输入" />
        </template>
      </el-table-column>
      <el-table-column align="right">
      <template #header>
        <el-button size="small" @click="obj.roles.push({})">新增</el-button>
      </template>
      <template #default="scope">
        <el-button
            size="small"
            type="danger"
            @click="obj.roles.splice(scope.$index, 1)"
        >
          Delete
        </el-button>
      </template>
    </el-table-column>
    </el-table>
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

import {Test2} from "../../arpc/Test2.ts";
let obj=new Test2()
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
