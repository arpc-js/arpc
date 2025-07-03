<template>
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
      <el-form :inline="true" :model="filter" class="filter-form">
        <el-form-item label="名称">
          <el-input v-model="filter.name" placeholder="Enter name" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table :data="tableData" style="width: 100%">
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
          <el-button size="small" type="danger" @click="del(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗：新增/修改/详情 -->
    <el-dialog :title="dialogTitle" v-model="showDialog" width="400px">
      <el-form :model="body" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="role.name" :disabled="dialogMode === 'detail'" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="权限">
          <el-select
              v-model="role.permission"
              multiple
              filterable
              collapse-tags
              placeholder="请选择权限"
              :disabled="dialogMode === 'detail'"
              value-key="id"
          >
            <el-option
                v-for="item in permissionOptions"
                :key="item.id"
                :label="item.name"
                :value="item"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
        <el-button type="primary" v-if="dialogMode !== 'detail'" @click="role.add()">提交</el-button>
      </template>
    </el-dialog>
  </el-card>
  <el-pagination @current-change="pageNo=>{filter.page=pageNo;gets()}" background layout="total,prev, pager, next" :page-size="filter.size" :total="total" />
</template>

<script lang="ts" setup>
import { ref,onMounted } from 'vue';
import {Role} from "../../api/Role.ts";
import {Permission} from "../../api/Permission.ts";
// 过滤器
const filter = ref({
  name: '',
  page:1,
  size:5
});
let role=new Role()
// 表格数据
const tableData = ref([]);
const permissionOptions = ref([]);

let total = ref(0);
const showDialog = ref(false);
// 弹窗模式：add | edit | detail
const dialogMode = ref<'add' | 'edit' | 'detail'>('add');
const dialogTitle = ref('');
// 表单数据
const body = ref({
  id: null,
  name: '',
  path: '',
});
// 查询接口
gets();
// 查询按钮
function search() {
  gets();
}
// 打开弹窗
function openDialog(mode: 'add' | 'edit' | 'detail', row?: any) {
  dialogMode.value = mode;
  dialogTitle.value = mode === 'add' ? '新增权限' : mode === 'edit' ? '修改权限' : '查看详情';
  if (row) {
    body.value = { ...row };
  } else {
    body.value = { id: null, name: '', path: '' };
  }
  showDialog.value = true;
}
async function gets() {
  tableData.value=await Role.sel('id','name').get`id>${1}`
  permissionOptions.value = await Permission.sel('id','name').get`id>${0}`;
}
// 提交新增或修改
async function submit() {
  if (dialogMode.value === 'add') {
    await post('/permission/add', body.value);
  } else if (dialogMode.value === 'edit') {
    await post('/permission/update', body.value);
  }
  showDialog.value = false;
  gets();
}

// 删除
async function del(id: number) {
  await post('/permission/del', { id });
  gets();
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
