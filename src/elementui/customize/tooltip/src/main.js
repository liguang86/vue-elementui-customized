import Popper from 'element-ui/src/utils/vue-popper';
import {debounce} from 'throttle-debounce';
import { addClass, removeClass, on, off } from 'element-ui/src/utils/dom';
import { generateId } from 'element-ui/src/utils/util';
import Vue from 'vue';

export default {
  name: 'ElTooltip',

  mixins: [Popper],

  props: {
    openDelay: {
      type: Number,
      default: 0
    },
    disabled: Boolean,
    manual: Boolean,
    effect: {
      type: String,
      default: 'dark'
    },
    arrowOffset: {
      type: Number,
      default: 0
    },
    popperClass: String,
    content: String,
    visibleArrow: {
      default: true
    },
    transition: {
      type: String,
      default: 'el-fade-in-linear'
    },
    overflowHidden: {
      default () {
        return false
      }
    },
    overflowHiddenHorizontal: {
      default () {
        return false
      }
    },
    overflowHiddenVertical: {
      default () {
        return false
      }
    },
    popperOptions: {
      default() {
        return {
          boundariesPadding: 10,
          gpuAcceleration: false
        };
      }
    },
    enterable: {
      type: Boolean,
      default: true
    },
    hideAfter: {
      type: Number,
      default: 0
    }
  },

  data() {
    return {
      tooltipId: `el-tooltip-${generateId()}`,
      timeoutPending: null,
      focusing: false
    };
  },
  beforeCreate() {
    if (this.$isServer) return;

    this.popperVM = new Vue({
      data: { node: '' },
      render(h) {
        return this.node;
      }
    }).$mount();

    this.debounceClose = debounce(50, () => this.handleClosePopper());
  },

  render(h) {
    if (this.popperVM) {
      this.popperVM.node = (
        <transition
          name={ this.transition }
          onAfterLeave={ this.doDestroy }>
          <div
            onMouseleave={ () => {
                this.setExpectedState(false);
                this.debounceClose();
              }
            }
            onMouseenter= { () => { this.setExpectedState(true); } }
            ref="popper"
            role="tooltip"
            id={this.tooltipId}
            aria-hidden={ (this.disabled || !this.showPopper) ? 'true' : 'false' }
            v-show={!this.disabled && this.showPopper}
            class={
              ['el-tooltip__popper', 'is-' + this.effect, this.popperClass]
            }>
            { this.$slots.content || this.content }
          </div>
        </transition>);
    }

    const firstElement = this.getFirstElement();
    if (!firstElement) return null;

    const data = firstElement.data = firstElement.data || {};
    data.staticClass = this.addTooltipClass(data.staticClass);

    return firstElement;
  },

  mounted() {
    this.referenceElm = this.$el;
    if (this.$el.nodeType === 1) {
      this.$el.setAttribute('aria-describedby', this.tooltipId);
      this.$el.setAttribute('tabindex', 0);
      on(this.referenceElm, 'mouseenter', this.show);
      on(this.referenceElm, 'mouseleave', this.hide);
      on(this.referenceElm, 'focus', () => {
        if (!this.$slots.default || !this.$slots.default.length) {
          this.handleFocus();
          return;
        }
        const instance = this.$slots.default[0].componentInstance;
        if (instance && instance.focus) {
          instance.focus();
        } else {
          this.handleFocus();
        }
      });
      on(this.referenceElm, 'blur', this.handleBlur);
      on(this.referenceElm, 'click', this.removeFocusing);
    }
    // fix issue https://github.com/ElemeFE/element/issues/14424
    if (this.value && this.popperVM) {
      this.popperVM.$nextTick(() => {
        if (this.value) {
          this.updatePopper();
        }
      });
    }
  },
  watch: {
    focusing(val) {
      if (val) {
        addClass(this.referenceElm, 'focusing');
      } else {
        removeClass(this.referenceElm, 'focusing');
      }
    },
    showPopper () {
      // if (this.showPopper) {
      //   on(document.body, 'mousewheel', this.hideImmediately)
      // } else {
      //   off(document.body, 'mousewheel', this.hideImmediately)
      // }
    }
  },
  methods: {
    show() {
      if (this.invalid) return
      this.setExpectedState(true);
      this.handleShowPopper();
    },
    hide() {
      this.setExpectedState(false);
      this.debounceClose();
    },
    hideImmediately() {
      this.setExpectedState(false);
      this.handleClosePopper();
      this.invalid = true;
      if (this.invalidTimer) {
        clearTimeout(this.invalidTimer)
      }
      this.invalidTimer = setTimeout(() => {
        this.invalid = false
        this.invalidTimer = 0
      }, 100)
    },
    handleFocus() {
      this.focusing = true;
      this.show();
    },
    handleBlur() {
      this.focusing = false;
      this.hide();
    },
    removeFocusing() {
      this.focusing = false;
    },

    addTooltipClass(prev) {
      if (!prev) {
        return 'el-tooltip';
      } else {
        return 'el-tooltip ' + prev.replace('el-tooltip', '');
      }
    },

    handleShowPopper() {
      let el = this.$el
      if (el) {
        if ((this.overflowHidden || this.overflowHiddenHorizontal) && el.offsetWidth >= el.scrollWidth - 1) {
          return;
        }
        if ((this.overflowHidden || this.overflowHiddenVertical) && el.offsetWidth >= el.scrollWidth - 1) {
          return;
        }
      }
      if (!this.expectedState || this.manual) return;
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.showPopper = true;
        this.$emit('show')
      }, this.openDelay);

      if (this.hideAfter > 0) {
        this.timeoutPending = setTimeout(() => {
          this.showPopper = false;
        }, this.hideAfter);
      }
    },

    handleClosePopper() {
      if (this.enterable && this.expectedState || this.manual) return;
      clearTimeout(this.timeout);

      if (this.timeoutPending) {
        clearTimeout(this.timeoutPending);
      }
      this.showPopper = false;

      if (this.disabled) {
        this.doDestroy();
      }
    },

    setExpectedState(expectedState) {
      if (expectedState === false) {
        clearTimeout(this.timeoutPending);
      }
      this.expectedState = expectedState;
    },

    getFirstElement() {
      const slots = this.$slots.default;
      if (!Array.isArray(slots)) return null;
      let element = null;
      for (let index = 0; index < slots.length; index++) {
        if (slots[index] && slots[index].tag) {
          element = slots[index];
        };
      }
      return element;
    }
  },

  beforeDestroy() {
    this.invalidTimer && clearTimeout(this.invalidTimer)
    this.popperVM && this.popperVM.$destroy();
  },

  destroyed() {
    const reference = this.referenceElm;
    off(document.body, 'mousewheel', this.hideImmediately)
    off(reference, 'mouseenter', this.show);
    off(reference, 'mouseleave', this.hide);
    off(reference, 'focus', this.handleFocus);
    off(reference, 'blur', this.handleBlur);
    off(reference, 'click', this.removeFocusing);
  }
};
