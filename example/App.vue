<template>
  <div id="app">
    <h2>示例</h2>
    <div>
      <el-button type="primary" @click="testModal">普通弹框</el-button>
      <el-button type="primary" @click="testDraggableModal">可拖动弹框</el-button>
      <el-button type="primary" @click="testStaticModal">静态可拖动弹框</el-button>
      <br/>
      <br/>
    </div>
    <div>
      <el-input v-model="model.mobile" input-type="mobile" :maxlength="11" placeholder="只能输入手机号"/>
      <br/>
      <br/>
      <el-input v-model="model.words" input-type="en" placeholder="只能输入英文"/>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app',
  components: {
  },
  data () {
    return {
      model: {
        mobile: '',
        words: ''
      }
    }
  },
  methods: {
    testModal () {
      this.modal('TestModal', '点了我').promise.then(rst => {
        console.log(rst)
      }).catch(rst => {
        console.log(rst)
      })
    },
    testDraggableModal () {
      this.modal('TestDraggableModal', '点了我').promise.then(rst => {
        console.log(rst)
      }).catch(rst => {
        console.log(rst)
      })
    },
    testStaticModal () {
      this.staticModal('TestStaticModal', '点了我').promise.then(rst => {
        console.log(rst)
      }).catch(rst => {
        console.log(rst)
      })
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
