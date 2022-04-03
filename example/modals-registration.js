import Modal from '../src/modal'
import TestModal from './modals/TestModal'
import TestStaticModal from './modals/TestStaticModal'
import TestDraggableModal from './modals/TestDraggableModal'
import Vue from 'vue'

Modal.initModal()
Vue.use(Modal)

let modals = {
  TestModal,
  TestStaticModal,
  TestDraggableModal
}

for (let key in modals) {
  if (modals.hasOwnProperty(key)) {
    Modal.registerModal(key, modals[key])
  }
}
