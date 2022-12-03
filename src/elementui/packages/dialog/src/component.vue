<template>
  <transition
    name="dialog-fade"
    @before-enter="beforeEnter"
    @after-enter="afterEnter"
    @before-leave="beforeLeave"
    @after-leave="afterLeave">
    <div class="el-dialog__wrapper" ref="wrapper" v-show="visible" :class="{ 'draggable': draggable }" :style="draggable ? 'overflow: unset;' : ''"
         @mousedown.self.left="handleWrapperMouseDown"
         @mouseup.self.left="handleWrapperMouseUp">
      <div
        v-if="!draggable"
        :key="key"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'dialog'"
        class="el-dialog"
        :class="[{ 'is-fullscreen': fullscreen, 'el-dialog--center': center }, customClass]"
        ref="dialog"
        :style="style">
        <div class="el-dialog__header">
          <slot name="title">
            <span class="el-dialog__title">{{ title }}</span>
          </slot>
          <button
            type="button"
            class="el-dialog__headerbtn"
            aria-label="Close"
            v-if="showClose"
            @click="handleClose">
            <i class="el-dialog__close el-icon el-icon-close"></i>
          </button>
        </div>
        <div class="el-dialog__body" v-if="rendered">
          <slot></slot>
        </div>
        <div class="el-dialog__footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
      <vue-draggable-resizable v-else class="el-dialog__draggable" :w="'auto'" :h="'auto'" :x="draggableX"
                               :y="draggableY" :drag-cancel="dragCancel" @activated="onActivated">
        <div
          role="dialog"
          :key="key"
          aria-modal="true"
          :aria-label="title || 'dialog'"
          class="el-dialog"
          :class="[customClass, hideOutside ? 'hide-outside' : '']"
          ref="dialog"
          :style="style">
          <div class="el-dialog__header">
            <slot name="title">
              <span class="el-dialog__title">{{ title }}</span>
            </slot>
            <button
              type="button"
              class="el-dialog__headerbtn"
              aria-label="Close"
              v-if="showClose"
              @click="handleClose">
              <i class="el-dialog__close el-icon el-icon-close"></i>
            </button>
          </div>
          <div class="el-dialog__body" v-if="rendered">
            <slot></slot>
          </div>
          <div class="el-dialog__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </vue-draggable-resizable>
    </div>
  </transition>
</template>

<script>
import Popup from 'element-ui/src/utils/popup'
import Migrating from 'element-ui/src/mixins/migrating'
import emitter from 'element-ui/src/mixins/emitter'
import VueDraggableResizable from 'vue-draggable-resizable'

export default {
  name: 'ElDialog',
  components: {VueDraggableResizable},
  mixins: [Popup, emitter, Migrating],

  props: {
    title: {
      type: String,
      default: ''
    },

    modal: {
      type: Boolean,
      default: true
    },

    modalAppendToBody: {
      type: Boolean,
      default: true
    },

    appendToBody: {
      type: Boolean,
      default: false
    },

    lockScroll: {
      type: Boolean,
      default: true
    },

    closeOnClickModal: {
      type: Boolean,
      default: true
    },

    closeOnPressEscape: {
      type: Boolean,
      default: true
    },

    showClose: {
      type: Boolean,
      default: true
    },

    width: String,

    fullscreen: Boolean,

    customClass: {
      type: String,
      default: ''
    },

    top: {
      type: String,
      default: '15vh'
    },
    beforeClose: Function,
    center: {
      type: Boolean,
      default: false
    },

    destroyOnClose: Boolean,

    draggable: {
      type: Boolean,
      default: false
    },
    // 不能拖动的样式，默认为 .el-dialog__body，也可以传入多个，逗号分隔
    dragCancel: {
      type: String,
      default: '.el-dialog__body'
    },
    // 是否隐藏遮罩
    hideMask: {
      type: Boolean,
      default: false
    },
    // 是否隐藏除了content之外的部分
    hideOutside: {
      type: Boolean,
      default: false
    },
    // 拖动弹窗默认的位置，{ left: 0, top: 0, right: 0, bottom: 0 }
    draggableInitPosition: {
      type: Object,
      default: null
    },
    draggableDefaultCenter: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      closed: false,
      draggableX: 0,
      draggableY: 0,
      key: 0
    }
  },

  watch: {
    visible (val) {
      if (val) {
        this.closed = false
        this.$emit('open')
        this.$el.addEventListener('scroll', this.updatePopper)
        this.$nextTick(() => {
          this.$refs.dialog.scrollTop = 0
        })
        if (this.appendToBody) {
          document.body.appendChild(this.$el)
        }
      } else {
        this.$el.removeEventListener('scroll', this.updatePopper)
        if (!this.closed) this.$emit('close')
      }
    },

    rendered (val) {
      if (val) {
        this.$nextTick(() => {
          // 初始化modal的位置
          this.initDraggablePosition()
        })
      }
    }
  },

  computed: {
    style () {
      let style = {}
      if (!this.fullscreen) {
        style.marginTop = this.top
        if (this.width) {
          style.width = this.width
        }
      }
      return style
    }
  },

  methods: {
    initDraggablePosition () {
      if (this.draggableInitPosition) {
        if (this.draggableInitPosition.left !== undefined) {
          this.draggableX = this.draggableInitPosition.left
        } else if (this.draggableInitPosition.right !== undefined) {
          this.draggableX = document.body.clientWidth - this.$refs.dialog.offsetWidth + this.draggableInitPosition.right
        }
        if (this.draggableInitPosition.top !== undefined) {
          this.draggableY = this.draggableInitPosition.top
        } else if (this.draggableInitPosition.bottom !== undefined) {
          this.draggableY = document.body.clientHeight - this.$refs.dialog.offsetHeight + this.draggableInitPosition.bottom
        }
      } else {
        let x = (document.body.clientWidth - this.$refs.dialog.offsetWidth) / 2
        let y = (document.body.clientHeight - this.$refs.dialog.offsetHeight) / 2
        if (y < 0) y = window.screen.height * 0.15
        if (x < 0) x = 10
        this.draggableX = x
        this.draggableY = y
      }
    },
    handleWrapperMouseDown (evt) {
      this.wrapperMDPos = {
        x: evt.clientX,
        y: evt.clientY
      }
    },
    onActivated () {
      this.bringToFront()
    },
    handleWrapperMouseUp (evt) {
      if (this.wrapperMDPos && this.wrapperMDPos.x === evt.clientX && this.wrapperMDPos.y === evt.clientY) {
        if (!this.closeOnClickModal) return
        this.handleClose()
      }
      this.wrapperMDPos = null
    },
    getMigratingConfig () {
      return {
        props: {
          'size': 'size is removed.'
        }
      }
    },
    handleClose () {
      if (typeof this.beforeClose === 'function') {
        this.beforeClose(this.hide)
      } else {
        this.hide()
      }
    },
    hide (cancel) {
      if (cancel !== false) {
        this.$emit('update:visible', false)
        this.$emit('close')
        this.closed = true
      }
    },
    updatePopper () {
      this.broadcast('ElSelectDropdown', 'updatePopper')
      this.broadcast('ElDropdownMenu', 'updatePopper')
    },
    beforeEnter () {
      if (this.hideMask && this.$refs.wrapper) {
        this.$refs.wrapper.style.right = this.$refs.wrapper.style.bottom = 'unset'
        this.$refs.wrapper.style.width = this.$refs.wrapper.style.height = '0'
      }
    },
    afterEnter () {
      this.$emit('opened')
    },
    beforeLeave () {
    },
    afterLeave () {
      if (this.draggable) {
        this.$refs.wrapper && (this.$refs.wrapper.style.right = this.$refs.wrapper.style.bottom = '0')
      }
      this.$emit('closed')
    }
  },

  mounted () {
    if (this.visible) {
      this.rendered = true
      this.open()
      if (this.appendToBody) {
        document.body.appendChild(this.$el)
      }
    }
  },

  destroyed () {
    // if appendToBody is true, remove DOM node after destroy
    if (this.appendToBody && this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  }
}
</script>
