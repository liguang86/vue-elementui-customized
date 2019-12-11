<template>
  <el-dialog title="测试" width="300px" :visible.sync="visible">
    <p>弹框内容</p>
    <el-button type="primary" @click="close(true)">确定</el-button>
  </el-dialog>
</template>

<script>
import ModalMixin from '../../src/modal/modal-mixin'
export default {
  mixins: [ModalMixin],
  methods: {
    init (msg) {
      console.log('TestModal收到信息', msg)
      return this.open()
    }
  }
}
</script>
