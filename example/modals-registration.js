import Modal from '../src/modal'
import TestModal from './modals/TestModal'
import Vue from 'vue'

Modal.initModal()
Vue.use(Modal)

let modals = {
  TestModal
}

for (let key in modals) {
  if (modals.hasOwnProperty(key)) {
    Modal.registerModal(key, modals[key])
  }
}
