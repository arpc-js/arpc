<template>
  <el-card>
    <el-form :model="obj" label-width="100px">
      <el-form-item label="名称">
        <el-input v-model="obj.name" :disabled="mode === 'detail'" placeholder="请输入" />
      </el-form-item>
      <!-- 根据字段动态渲染也可 -->
    </el-form>

    <el-button @click="goBack">返回</el-button>
    <el-button v-if="mode !== 'detail'" type="primary" @click="save">保存</el-button>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Role } from '../../api/Role.ts'

const route = useRoute()
const router = useRouter()

const mode = ref<'add' | 'edit' | 'detail'>(route.name === 'RoleEdit' ? 'edit' : route.name === 'RoleDetail' ? 'detail' : 'add')

let obj = null

async function loadData(id: number) {
  const data = await Role.sel('id', 'name', 'remark').get(id)
  Object.assign(obj, data)
}

onMounted(async () => {
   [obj] =await Role.sel('id','name').get(36)

})

function goBack() {
  router.back()
}

async function save() {
  try {
    await obj.sync()
    router.back()
  } catch (e) {
    console.error('保存失败', e)
  }
}
</script>
