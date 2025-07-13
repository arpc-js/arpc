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
          <el-button type="primary" @click="o.migrate()">迁移</el-button>
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

    <!-- 弹窗 -->
    <el-dialog :title="dialogTitle" v-model="showDialog" width="1200px">
      <el-form :model="o" label-width="80px">
        <el-form-item label="类名">
          <el-input v-model="o.name" :disabled="dialogMode === 'detail'" placeholder="请输入类名" />
        </el-form-item>

        <el-form-item label="菜单名">
          <el-input v-model="o.menu.name" :disabled="dialogMode === 'detail'" placeholder="菜单名" />
        </el-form-item>
        <el-form-item label="父菜单">
          <el-input v-model="o.menu.parent" :disabled="dialogMode === 'detail'" placeholder="父菜单" />
        </el-form-item>
        <el-button
            type="primary"
            plain
            size="small"
            @click="addAttr"
            style="margin-top: 10px"
        >添加</el-button>
        <el-form-item label="属性列表">
          <div v-for="(attr, index) in o.attr" :key="index" class="attr-row">
            <el-input
                v-model="attr.key"
                placeholder="属性名"
                style="width: 40%; margin-right: 8px"
                :disabled="dialogMode === 'detail'"
            />
            <el-input
                v-model="attr.tag"
                placeholder="属性名"
                style="width: 40%; margin-right: 8px"
                :disabled="dialogMode === 'detail'"
            />
            <el-select
                v-model="attr.type"
                placeholder="类型"
                style="width: 40%; margin-right: 8px"
                :disabled="dialogMode === 'detail'"
            >
              <el-option label="string" value="string" />
              <el-option label="number" value="number" />
              <el-option label="boolean" value="boolean" />
              <el-option label="Date" value="Date" />
              <el-option label="any" value="any" />
            </el-select>
            <el-select
                v-model="attr.input"
                placeholder="输入类型"
                style="width: 40%; margin-right: 8px"
                :disabled="dialogMode === 'detail'"
            >
              <el-option label="输入框" value="input" />
              <el-option label="下拉框" value="sel" />
              <el-option label="多选下拉" value="boolean" />
              <el-option label="多选下拉" value="boolean" />
              <el-option label="Date" value="Date" />
              <el-option label="any" value="any" />
            </el-select>
            <el-input
                v-if="['sel', 'boolean'].includes(attr.input)"
                v-model="attr.source"
                placeholder="下拉数据源"
                style="width: 40%; margin-right: 8px"
            />
            <el-input
                v-model="attr.filter"
                placeholder="筛选"
                style="width: 22%; margin-right: 8px"
                :disabled="dialogMode === 'detail'"
            />
            <el-select
                v-model="attr.hide"
                multiple
                placeholder="隐藏"
                :disabled="dialogMode === 'detail'"
            >
              <el-option label="详情" value="get" />
              <el-option label="列表" value="gets" />
              <el-option label="新增" value="add" />
              <el-option label="修改" value="update" />
            </el-select>
            <el-button type="danger" size="small" @click="o.attr.splice(index, 1)">删除</el-button>
          </div>

        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDialog = false">关闭</el-button>
        <el-button type="primary" v-if="dialogMode !== 'detail'" @click="submitAdd">提交</el-button>
      </template>
    </el-dialog>

    <el-pagination
        @current-change="pageNo => { filter.page = pageNo; gets() }"
        background
        layout="total,prev, pager, next"
        :page-size="filter.size"
        :total="total"
    />
  </el-card>
</template>
<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { post } from '../../utils/request.ts'
import { Obj } from '../../api/Obj.ts'

// 过滤器
const filter = ref({
  name: '',
  page: 1,
  size: 5
})

// 表格数据
const tableData = ref([])
const total = ref(0)

// 弹窗控制
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit' | 'detail'>('add')
const dialogTitle = ref('')

// 实例化对象 o
const o = new Obj()
o.menu = { name: '', parent: '' }  // ✅ 这样是可以的
o.attr = []
console.log(o)
// 获取数据列表
async function gets() {
  tableData.value = await o.gets()
}
gets()

// 查询按钮
function search() {
  gets()
}

// 打开弹窗
function openDialog(mode: 'add' | 'edit' | 'detail', row?: any) {
  console.log(o)
  dialogMode.value = mode
  dialogTitle.value = mode === 'add' ? '新增' : mode === 'edit' ? '编辑' : '查看详情'
  if (mode === 'add') {
  } else if (row) {
  }
  showDialog.value = true
}

// 添加属性行
function addAttr() {
  o.attr.push({ key: '', type: '' })
}

// 提交新增类
async function submitAdd() {
  await o.add() // 内部已 RPC 写入 .ts 文件
  showDialog.value = false
  //gets()
}

// 删除
async function del(id: number) {
  await post('/permission/del', { id })
  gets()
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
.attr-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
