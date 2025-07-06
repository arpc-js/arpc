<template>
  <el-dialog
      :model-value="visible"
      @update:model-value="val => emit('update:visible', val)"
      :title="title"
      width="500px"
  >
    <el-form>
      <el-form-item
          v-for="([key, value], index) in filteredEntries"
          :key="key"
          :label="keyMap?.[key] || key"
      >
        <component
            :is="resolveComponent(value)"
            v-model="model[key]"
            v-bind="getAttrs(value)"
            :disabled="mode === 'detail'"
        >
          <el-option
              v-if="Array.isArray(value) && value.length && typeof value[0] === 'object'"
              v-for="item in value"
              :key="item.id"
              :label="item.name"
              :value="item"
          />
        </component>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">关闭</el-button>
      <el-button type="primary" v-if="mode !== 'detail'" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

// Props
const props = defineProps<{
  visible: boolean
  mode: 'add' | 'edit' | 'detail'
  model: Record<string, any>
  title?: string
  keyMap?: Record<string, string> // 可选字段名中文映射
  excludeKeys?: string[]          // 过滤字段列表，默认排除 id, list, size, total
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit'): void
}>()

// 默认排除字段
const excludeKeys = computed(() => props.excludeKeys ?? ['id', 'list', 'size','page','total'])

// 使用 Object.entries 过滤后再遍历，避免 v-if 影响渲染效率和准确性
const filteredEntries = computed(() =>
    Object.entries(props.model).filter(([key]) => !excludeKeys.value.includes(key))
)

// 根据字段类型推断组件
function resolveComponent(val: any) {
  if (Array.isArray(val)) {
    if (val.length > 0 && typeof val[0] === 'object') return 'el-select'
    return 'el-input'
  }
  if (typeof val === 'boolean') return 'el-switch'
  if (typeof val === 'number') return 'el-input-number'
  return 'el-input'
}

// 附加属性
function getAttrs(val: any) {
  const attrs: any = {}
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
    attrs.multiple = true
    attrs.filterable = true
    attrs.clearable = true
    attrs.valueKey = 'id'
  }
  if (typeof val === 'number') attrs.controls = true
  if (typeof val === 'string') attrs.placeholder = '请输入'
  return attrs
}

// 提交处理
async function handleSubmit() {
  try {
    await props.model?.sync?.()
    emit('submit')
    emit('update:visible', false)
  } catch (err) {
    console.error('提交失败', err)
  }
}
</script>
