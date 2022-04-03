import _ from 'lodash'

export default {
  data () {
    return {
      visible: false,
      preventCloseOnRoute: false
    }
  },
  methods: {
    open (delay) {
      if (this.visible) {
        try {
          this.$root.$children[0].$children[0].bringToFront()
        } catch (e) {}
        return this.openPromise
      }
      if (delay && _.isNumber(delay)) {
        this.visibleDelayHandler = setTimeout(() => {
          this.visible = true
        }, delay)
      } else {
        this.visible = true
      }
      this.openPromise = new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      }).finally(() => {
        // 防止意外关闭窗口 未释放资源
        setTimeout(() => {
          this.doDestroy()
        }, 500)
      })
      return this.openPromise
    },
    clearVisibleDealyHandler () {
      this.visibleDelayHandler && clearTimeout(this.visibleDelayHandler)
      this.visibleDelayHandler = null
    },
    // result resolve的结果
    close (result) {
      this.clearVisibleDealyHandler()
      this.visible = false
      this.reject = null
      this.resolve && this.resolve(result)
    },
    doDestroy () {
      if (this.$root && this.$root.$el) {
        if (this.$root._isBeingDestroyed || this.$root._isDestroyed) return
        document.body.removeChild(this.$root.$el)
        this.$root.$destroy()
      }
    }
  },
  beforeDestroy () {},
  watch: {
    '$route' () {
      if (this.preventCloseOnRoute) {
        return
      }
      if (this.visible) {
        this.close()
      } else {
        this.doDestroy()
      }
    },
    visible () {
      if (this.visible === false) {
        this.clearVisibleDealyHandler()
        this.reject && this.reject(-1)
        setTimeout(() => {
          this.doDestroy()
        }, 500)
      }
    }
  }
}
