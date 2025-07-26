<template>
  <el-card>
    <!-- 筛选区域 -->
    <div class="toolbar">
      <el-form :inline="true" :model="filter" class="filter-form">
        <el-form-item label="名称">
          <el-input v-model="filter.name" placeholder="Enter name" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">查询</el-button>
          <el-button type="primary" @click="o.migrate()">增量迁移</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格区域 -->
    <el-table :data="tableData" style="width: 100%" border>
      <el-table-column prop="id" label="ID" width="100" />
      <el-table-column prop="name" label="arpc对象" />
      <el-table-column width="240" align="right">
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
          <el-button icon="View" circle  size="small" @click="openDialog('detail', scope.row)"/>
          <el-button icon="Edit" type="primary" circle size="small" @click="openDialog('edit', scope.row)"/>
          <el-button icon="Delete" type="danger" circle size="small"  @click="del(scope.row.id)"/>
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
              <el-option
                  v-for="type in typeOptions"
                  :key="type"
                  :label="type"
                  :value="type"
              />
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
import { Obj } from '../../arpc/Obj.ts'

// 过滤器
const filter = ref({
  name: '',
  page: 1,
  size: 5
})

// 表格数据
const tableData = ref([])
const total = ref(0)
const typeOptions = ref([])
// 弹窗控制
const showDialog = ref(false)
const dialogMode = ref<'add' | 'edit' | 'detail'>('add')
const dialogTitle = ref('')

// 实例化对象 o
const o = new Obj()
// 获取数据列表
async function gets() {
  tableData.value = await o.gets()
  typeOptions.value = await o.getTypes()
}
gets()

// 查询按钮
function search() {
  gets()
}

// 打开弹窗
function openDialog(mode: 'add' | 'edit' | 'detail', row?: any) {
  dialogMode.value = mode
  dialogTitle.value = mode === 'add' ? '新增' : mode === 'edit' ? '编辑' : '查看详情'

  if (mode === 'add') {
    // 清空
    Object.assign(o, new Obj()) // 重置对象
    o.menu = { name: '', parent: '' }
    o.attr = []
  } else if (row) {
    // 核心补充：把 row 的值赋给 o（推荐使用深拷贝）
    Object.assign(o, JSON.parse(JSON.stringify(row))) // 避免引用混乱
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
