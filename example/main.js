import Vue from 'vue'
import App from './App.vue'
import el from 'element-ui'
import './modals-registration'

Vue.config.productionTip = false

Vue.use(el)

new Vue({
  render: h => h(App)
}).$mount('#app')
