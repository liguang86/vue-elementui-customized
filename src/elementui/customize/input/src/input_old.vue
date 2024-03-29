<template>
  <div :class="[
    type === 'textarea' ? 'el-textarea' : 'el-input',
    inputSize ? 'el-input--' + inputSize : '',
    {
      'is-disabled': inputDisabled,
      'el-input-group': $slots.prepend || $slots.append,
      'el-input-group--append': $slots.append,
      'el-input-group--prepend': $slots.prepend,
      'el-input--prefix': $slots.prefix || prefixIcon,
      'el-input--suffix': $slots.suffix || suffixIcon
    }
    ]"
       @mouseenter="hovering = true"
       @mouseleave="hovering = false"
  >
    <template v-if="type !== 'textarea'">
      <!-- 前置元素 -->
      <div class="el-input-group__prepend" v-if="$slots.prepend">
        <slot name="prepend"></slot>
      </div>
      <input
          :tabindex="tabindex"
          v-if="type !== 'textarea'"
          class="el-input__inner"
          v-bind="$attrs"
          :type="type"
          :disabled="inputDisabled"
          :autocomplete="autoComplete"
          :value="currentValue"
          ref="input"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
          @change="handleChange"
          :aria-label="label"
      >
      <!-- 前置内容 -->
      <span class="el-input__prefix" v-if="$slots.prefix || prefixIcon" :style="prefixOffset">
        <slot name="prefix"></slot>
        <i class="el-input__icon"
           v-if="prefixIcon"
           :class="prefixIcon">
        </i>
      </span>
      <!-- 后置内容 -->
      <span
          class="el-input__suffix"
          v-if="$slots.suffix || suffixIcon || showClear || validateState && needStatusIcon"
          :style="suffixOffset">
        <span class="el-input__suffix-inner">
          <template v-if="!showClear">
            <slot name="suffix"></slot>
            <i class="el-input__icon"
               v-if="suffixIcon"
               :class="suffixIcon">
            </i>
          </template>
          <i v-else
             class="el-input__icon el-icon-circle-close el-input__clear"
             @click="clear"
          ></i>
        </span>
        <i class="el-input__icon"
           v-if="validateState"
           :class="['el-input__validateIcon', validateIcon]">
        </i>
      </span>
      <!-- 后置元素 -->
      <div class="el-input-group__append" v-if="$slots.append">
        <slot name="append"></slot>
      </div>
    </template>
    <textarea
        v-else
        :tabindex="tabindex"
        class="el-textarea__inner"
        :value="currentValue"
        @input="handleInput"
        ref="textarea"
        v-bind="$attrs"
        :disabled="inputDisabled"
        :style="textareaStyle"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
        :aria-label="label">
    </textarea>
  </div>
</template>
<script>
  import _ from 'lodash'
  import emitter from 'element-ui/src/mixins/emitter'
  import Migrating from 'element-ui/src/mixins/migrating'
  import calcTextareaHeight from 'element-ui/packages/input/src/calcTextareaHeight'
  import merge from 'element-ui/src/utils/merge'

  let regObj = {
    partCode: [/^[a-zA-Z0-9 \r\n]*$/, /[a-zA-Z0-9 \r\n]*/],
    number: [/^-?(([0-9]+\.)?[0-9]+)?$/, /-?(([0-9]+\.)?[0-9]+)?/],
    int: [/^(0|-?([1-9][0-9]*)?)$/, /(0|-?([1-9][0-9]*)?)/],
    uint: [/^(0|([1-9][0-9]*)?)$/, /(0|([1-9][0-9]*)?)/],
    en: [/^[a-zA-Z0-9 _\-<>,.'":;!@#$%^&*()+?=|\\~/[\]{}\r\n]*$/, /[a-zA-Z0-9 _\-<>,.'":;!@#$%^&*()+?=|\\~/[\]{}\r\n]*/],
    'en-word': [/^[a-zA-Z0-9]*$/, /[a-zA-Z0-9]*/],
    phone: [/^[0-9]+(-?[0-9-]+)?$/, /[0-9]+(-?[0-9-]+)?/],
    currency: [/^[0-9]+\.?[0-9]?[0-9]?$/, /[0-9]+\.?[0-9]?[0-9]?/]
  }

  export default {
    name: 'ElInput',

    componentName: 'ElInput',

    mixins: [emitter, Migrating],

    inheritAttrs: false,

    inject: {
      elForm: {
        default: ''
      },
      elFormItem: {
        default: ''
      }
    },

    data () {
      return {
        currentValue: this.value,
        textareaCalcStyle: {},
        prefixOffset: null,
        suffixOffset: null,
        hovering: false,
        focused: false
      }
    },

    props: {
      inputType: {
        type: String
      },
      // upper lower or null
      caseType: null,
      value: [String, Number],
      size: String,
      resize: String,
      form: String,
      disabled: Boolean,
      type: {
        type: String,
        default: 'text'
      },
      autosize: {
        type: [Boolean, Object],
        default: false
      },
      autoComplete: {
        type: String,
        default: 'off'
      },
      validateEvent: {
        type: Boolean,
        default: true
      },
      suffixIcon: String,
      prefixIcon: String,
      label: String,
      clearable: {
        type: Boolean,
        default: false
      },
      tabindex: String
    },

    computed: {
      _elFormItemSize () {
        return (this.elFormItem || {}).elFormItemSize
      },
      validateState () {
        return this.elFormItem ? this.elFormItem.validateState : ''
      },
      needStatusIcon () {
        return this.elForm ? this.elForm.statusIcon : false
      },
      validateIcon () {
        return {
          validating: 'el-icon-loading',
          success: 'el-icon-circle-check',
          error: 'el-icon-circle-close'
        }[this.validateState]
      },
      textareaStyle () {
        return merge({}, this.textareaCalcStyle, {resize: this.resize})
      },
      inputSize () {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size
      },
      inputDisabled () {
        return this.disabled || (this.elForm || {}).disabled
      },
      isGroup () {
        return this.$slots.prepend || this.$slots.append
      },
      showClear () {
        return this.clearable && !this.disabled && this.currentValue !== '' && (this.focused || this.hovering)
      }
    },

    watch: {
      'value' (val, oldValue) {
        this.setCurrentValue(val)
      }
    },

    methods: {
      strValid (newValue) {
        if (newValue.length > 0 && this.inputType && regObj[this.inputType]) {
          return regObj[this.inputType][0].test(newValue)
        }
        return true
      },
      focus () {
        (this.$refs.input || this.$refs.textarea).focus()
      },
      blur () {
        (this.$refs.input || this.$refs.textarea).blur()
      },
      getMigratingConfig () {
        return {
          props: {
            'icon': 'icon is removed, use suffix-icon / prefix-icon instead.',
            'on-icon-click': 'on-icon-click is removed.'
          },
          events: {
            'click': 'click is removed.'
          }
        }
      },
      handleBlur (event) {
        this.focused = false
        this.$emit('blur', event)
        if (this.validateEvent) {
          this.dispatch('ElFormItem', 'el.form.blur', [this.currentValue])
        }
      },
      select () {
        (this.$refs.input || this.$refs.textarea).select()
      },
      resizeTextarea () {
        if (this.$isServer) return
        const {autosize, type} = this
        if (type !== 'textarea') return
        if (!autosize) {
          this.textareaCalcStyle = {
            minHeight: calcTextareaHeight(this.$refs.textarea).minHeight
          }
          return
        }
        const minRows = autosize.minRows
        const maxRows = autosize.maxRows

        this.textareaCalcStyle = calcTextareaHeight(this.$refs.textarea, minRows, maxRows)
      },
      handleFocus (event) {
        this.focused = true
        this.$emit('focus', event)
      },
      handleInput (event) {
        let value = event.target.value || ''
        if (this.caseType) {
          value = this.caseType === 'upper' ? value.toUpperCase() : value.toLowerCase()
        }
        if (this.inputType) {
          if (!this.strValid(value)) {
            let reg = regObj[this.inputType][1]
            let globalReg = new RegExp(reg, 'g')
            let validStrs = _.filter(value.match(globalReg), e => e).join('').match(reg)
            let validStr = validStrs && validStrs[0] || ''
            event.target.value = validStr
            this.$emit('input', validStr)
            this.setCurrentValue(validStr)
            // if (validStr) {
            //
            // } else {
            //   event.target.value = _.isNil(this.value) ? '' : this.value
            // }
          } else {
            this.$emit('input', value)
            this.setCurrentValue(value)
          }
        } else {
          this.$emit('input', value)
          this.setCurrentValue(value)
        }
      },
      handleChange (event) {
        this.$emit('change', event.target.value)
      },
      setCurrentValue (value) {
        if (value === this.currentValue) return
        this.$nextTick(() => {
          this.resizeTextarea()
        })
        this.currentValue = value
        if (this.validateEvent) {
          this.dispatch('ElFormItem', 'el.form.change', [value])
        }
      },
      calcIconOffset (place) {
        const pendantMap = {
          'suf': 'append',
          'pre': 'prepend'
        }

        const pendant = pendantMap[place]

        if (this.$slots[pendant]) {
          return {transform: `translateX(${place === 'suf' ? '-' : ''}${this.$el.querySelector(`.el-input-group__${pendant}`).offsetWidth}px)`}
        }
      },
      clear () {
        this.$emit('input', '')
        this.$emit('change', '')
        this.$emit('clear')
        this.setCurrentValue('')
        this.focus()
      }
    },

    created () {
      this.$on('inputSelect', this.select)
    },

    mounted () {
      this.resizeTextarea()
      if (this.isGroup) {
        this.prefixOffset = this.calcIconOffset('pre')
        this.suffixOffset = this.calcIconOffset('suf')
      }
    }
  }
</script>
