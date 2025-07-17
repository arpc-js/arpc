<template>
  <view class="container">
    <uni-section title="修改信息" type="line">
      <view class="example">
        <!-- 基础用法，不包含校验规则 -->
        <uni-forms ref="baseForm" :modelValue="baseFormData">
          <uni-forms-item label="姓名" required>
            <uni-easyinput v-model="u.name" placeholder="请输入姓名" />
          </uni-forms-item>
          <uni-forms-item label="头像" required>
            <uni-file-picker
                v-model="imageValue"
                @select="select"
                fileMediatype="image"
                :limit="1"
            />
          </uni-forms-item>
        </uni-forms>

      </view>
    </uni-section>
    <button type="primary" @click="submit('customForm')">提交</button>
  </view>
</template>
<script>
import {User} from "../../arpc/User";

export default {
  data() {
    return {
      imageValue:[],
      u:new User(),
      // 基础表单数据
      baseFormData: {
        name: '',
        age: '',
        introduction: '',
        sex: 2,
        hobby: [5],
        datetimesingle: 1627529992399
      },
      // 表单数据
      alignmentFormData: {
        name: '',
        age: '',
      },
      // 单选数据源
      sexs: [{
        text: '男',
        value: 0
      }, {
        text: '女',
        value: 1
      }, {
        text: '保密',
        value: 2
      }],
      // 多选数据源
      hobbys: [{
        text: '跑步',
        value: 0
      }, {
        text: '游泳',
        value: 1
      }, {
        text: '绘画',
        value: 2
      }, {
        text: '足球',
        value: 3
      }, {
        text: '篮球',
        value: 4
      }, {
        text: '其他',
        value: 5
      }],
      // 分段器数据
      current: 0,
      items: ['左对齐', '顶部对齐'],
      // 校验表单数据
      valiFormData: {
        name: '',
        age: '',
        introduction: '',
      },
      // 校验规则
      rules: {
        name: {
          rules: [{
            required: true,
            errorMessage: '姓名不能为空'
          }]
        },
        age: {
          rules: [{
            required: true,
            errorMessage: '年龄不能为空'
          }, {
            format: 'number',
            errorMessage: '年龄只能输入数字'
          }]
        }
      },
      // 自定义表单数据
      customFormData: {
        name: '',
        age: '',
        hobby: []
      },
      // 自定义表单校验规则
      customRules: {
        name: {
          rules: [{
            required: true,
            errorMessage: '姓名不能为空'
          }]
        },
        age: {
          rules: [{
            required: true,
            errorMessage: '年龄不能为空'
          }]
        },
        hobby: {
          rules: [{
            format: 'array'
          },
            {
              validateFunction: function(rule, value, data, callback) {
                if (value.length < 2) {
                  callback('请至少勾选两个兴趣爱好')
                }
                return true
              }
            }
          ]
        }

      },
      dynamicFormData: {
        email: '',
        domains: {}
      },
      dynamicLists: [],
      dynamicRules: {
        email: {
          rules: [{
            required: true,
            errorMessage: '域名不能为空'
          }, {
            format: 'email',
            errorMessage: '域名格式错误'
          }]
        }
      }
    }
  },
  computed: {
    // 处理表单排列切换
    alignment() {
      if (this.current === 0) return 'left'
      if (this.current === 1) return 'top'
      return 'left'
    }
  },
  onLoad() {
  },
  onReady() {
    // 设置自定义表单校验规则，必须在节点渲染完毕后执行
    //this.$refs.customForm.setRules(this.customRules)
  },
  methods: {
    async select(e){
      let rsp=await uni.uploadFile({url: 'https://chenmeijia.top/up',
        filePath: e.tempFilePaths[0],
        name: 'file',
      });
      this.u.avatar=rsp.data
      console.log('上传结果：',rsp.data)
    },
    onClickItem(e) {
      console.log(e);
      this.current = e.currentIndex
    },
    add() {
      this.dynamicLists.push({
        label: '域名',
        rules: [{
          'required': true,
          errorMessage: '域名项必填'
        }],
        id: Date.now()
      })
    },
    del(id) {
      let index = this.dynamicLists.findIndex(v => v.id === id)
      this.dynamicLists.splice(index, 1)
    },
    async submit(ref) {
      if (!this.u.name &&!this.u.avatar) {
        throw '至少修改一个'
      }
      await this.u.updateById(uni.getStorageSync('uid'))
      uni.reLaunch({ url: '/pages/me/me' });
    },
  }
}
</script>
<style lang="scss">

.example {
  padding: 15px;
  background-color: #fff;
}

.segmented-control {
  margin-bottom: 15px;
}

.button-group {
  margin-top: 15px;
  display: flex;
  justify-content: space-around;
}

.form-item {
  display: flex;
  align-items: center;
}

.button {
  display: flex;
  align-items: center;
  height: 35px;
  margin-left: 10px;
}
</style>

