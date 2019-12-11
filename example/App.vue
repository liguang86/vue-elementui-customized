<template>
  <div id="app">
    <h2>示例</h2>
    <div>
      <el-button type="primary" @click="test">点我弹框吧</el-button>
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
    test () {
      this.modal('TestModal', '点了我').promise.then(rst => {
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
