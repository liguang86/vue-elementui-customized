<template>
  <el-dialog title="静态弹窗测试" width="300px" :draggable="true" :hide-mask="true" :hide-outside="false" :visible.sync="visible">
    <p>静态弹框内容</p>
    <el-button type="primary" @click="close(true)">确定</el-button>
  </el-dialog>
</template>

<script>
import ModalMixin from '../../src/modal/modal-mixin'
export default {
  mixins: [ModalMixin],
  methods: {
    init (msg) {
      console.log('TestStaticModal收到信息', msg)
      return this.open()
    }
  }
}
</script>
