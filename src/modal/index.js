import Vue from 'vue'
import _ from 'lodash'

let modals = {}
let initVueComponentInModals

// need2Injected 是一个包含需要被注入到Modal实例的对象，一般传入{router, store}
const initModal = (need2Injected) => {
  initVueComponentInModals = key => {
    let options = {
      components: {Modal: modals[key]},
      template: '<Modal/>'
    }
    if (need2Injected) {
      for (let k in need2Injected) {
        if (need2Injected.hasOwnProperty(k)) {
          options[k] = need2Injected[k]
        }
      }
    }
    modals[key] = Vue.extend(options)
  }
}

// 注册Modal组件
const registerModal = (name, ModalComponent) => {
  if (!initVueComponentInModals) {
    console.error('请先调用initModal进行初始化操作')
    return
  }
  modals[name] = ModalComponent
  initVueComponentInModals(name)
}

const staticModals = {}
export default {
  initModal,
  registerModal,
  install (Vue) {
    // 第一个参数：名称，其它参数：传入init方法的参数
    // 返回一个对象，包含modal引用以及promise对象{ref, promise}
    Vue.prototype.modal = function () {
      let name
      let otherArgs = []
      _.forEach(arguments, arg => {
        if (name) {
          otherArgs.push(arg)
        } else {
          name = arg
        }
      })
      if (!name || !modals[name]) throw new Error('modal invoke error')
      let Component = modals[name]
      let vm = new Component()
      vm.$mount()
      document.body.appendChild(vm.$el)
      let modal = vm.$children[0]
      if (!modal.init || !_.isFunction(modal.init)) {
        document.body.removeChild(vm.$el)
        throw new Error('[init] method of Modal component is needed')
      }
      let promise = modal.init.apply(modal, otherArgs)
      if (promise) {
        return {ref: modal, promise}
      } else {
        document.body.removeChild(vm.$el)
        vm.$destroy()
        return null
      }
    }
    Vue.prototype.staticModal = function () {
      const name = arguments[0]
      const modal = staticModals[name]
      if (name && modal) {
        let promise = modal.init.apply(modal, [...arguments].slice(1, arguments.length))
        if (promise) {
          const rst = {ref: modal, promise}
          staticModals[name] = rst.ref
          promise.finally(() => {
            delete staticModals[name]
          })
          return rst
        } else {
          const vm = modal.$parent
          document.body.removeChild(vm.$el)
          vm.$destroy()
          delete staticModals[name]
          return null
        }
      } else {
        const rst = Vue.prototype.modal.apply(modal, arguments)
        if (rst) {
          staticModals[name] = rst.ref
          rst.promise.finally(() => {
            delete staticModals[name]
          })
        }
        return rst
      }
    }
  }
}
