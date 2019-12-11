<template>
  <div class="el-loading-container" v-show="visible">
    <transition name="el-loading-fade" @after-leave="handleAfterLeave">
      <div
        v-show="loadingVisible"
        class="el-loading-mask"
        :style="{ backgroundColor: background || '' }"
        :class="[customClass, { 'is-fullscreen': fullscreen }]">
        <div class="el-loading-spinner">
          <svg v-if="!spinner" class="circular" viewBox="25 25 50 50">
            <circle class="path" cx="50" cy="50" r="20" fill="none"/>
          </svg>
          <i v-else :class="spinner"></i>
          <p v-if="text" class="el-loading-text">{{ text }}</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        text: null,
        spinner: null,
        background: null,
        fullscreen: true,
        visible: false,
        customClass: '',
        loadingVisible: false
      };
    },

    methods: {
      handleAfterLeave() {
        this.$emit('after-leave');
      },
      setText(text) {
        this.text = text;
      }
    },

    watch: {
      visible: {
        immediate: true,
        handler (nv) {
          if (nv) {
            if (this.timer) {
              clearTimeout(this.timer)
            }
            this.timer = setTimeout(() => {
              if (this.visible) this.loadingVisible = true
            }, 200)
          } else {
            if (this.timer) {
              this.loadingVisible = false
              clearTimeout(this.timer)
              this.timer = null
            }
          }
        }
      }
    },

    beforeDestroy () {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = null
      }
    }
  };
</script>

<style>
  .el-loading-container{
    position: absolute;
    z-index: 1999;
    background: transparent !important;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
</style>
