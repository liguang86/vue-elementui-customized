<template>
  <div :class="[
    type === 'textarea' ? 'el-textarea' : 'el-input',
    inputSize ? 'el-input--' + inputSize : '',
    {
      'is-disabled': inputDisabled,
      'is-exceed': inputExceed,
      'el-input-group': $slots.prepend || $slots.append,
      'el-input-group--append': $slots.append,
      'el-input-group--prepend': $slots.prepend,
      'el-input--prefix': $slots.prefix || prefixIcon,
      'el-input--suffix': $slots.suffix || suffixIcon || clearable || showPassword
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
        :type="showPassword ? (passwordVisible ? 'text': 'password') : type"
        :disabled="inputDisabled"
        :readonly="readonly"
        :autocomplete="autoComplete || autocomplete"
        ref="input"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @change="handleChange"
        :aria-label="label"
      >
      <!-- 前置内容 -->
      <span class="el-input__prefix" v-if="$slots.prefix || prefixIcon">
        <slot name="prefix"></slot>
        <i class="el-input__icon"
           v-if="prefixIcon"
           :class="prefixIcon">
        </i>
      </span>
      <!-- 后置内容 -->
      <span
        class="el-input__suffix"
        v-if="getSuffixVisible()">
        <span class="el-input__suffix-inner">
          <template v-if="!showClear || !showPwdVisible || !isWordLimitVisible">
            <slot name="suffix"></slot>
            <i class="el-input__icon"
               v-if="suffixIcon"
               :class="suffixIcon">
            </i>
          </template>
          <i v-if="showClear"
             class="el-input__icon el-icon-circle-close el-input__clear"
             @click.stop="clear"
          ></i>
          <i v-if="showPwdVisible"
             class="el-input__icon el-icon-view el-input__clear"
             @click="handlePasswordVisible"
          ></i>
          <span v-if="isWordLimitVisible" class="el-input__count">
            <span class="el-input__count-inner">
              {{ textLength }}/{{ upperLimit }}
            </span>
          </span>
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
      @compositionstart="handleCompositionStart"
      @compositionend="handleCompositionEnd"
      @input="handleInput"
      ref="textarea"
      v-bind="$attrs"
      :disabled="inputDisabled"
      :readonly="readonly"
      :autocomplete="autoComplete || autocomplete"
      :style="textareaStyle"
      @focus="handleFocus"
      @blur="handleBlur"
      @change="handleChange"
      :aria-label="label"
    >
    </textarea>
    <span v-if="isWordLimitVisible && type === 'textarea'" class="el-input__count">{{ textLength }}/{{ upperLimit }}</span>
  </div>
</template>
<script>
  import _ from 'lodash'
  import emitter from 'element-ui/src/mixins/emitter';
  import Migrating from 'element-ui/src/mixins/migrating';
  import calcTextareaHeight from './calcTextareaHeight';
  import merge from 'element-ui/src/utils/merge';

  // 第一个是整个全部匹配，第二个是部分匹配（如果不能全部匹配，则通过第二个取出部分匹配的部分）
  let regObj = {
    partCode: [/^[a-zA-Z0-9 \r\n]*$/, /[a-zA-Z0-9 \r\n]*/],
    number: [/^-?(([0-9]+\.)?[0-9]+)?$/, /-?(([0-9]+\.)?[0-9]+)?/],
    int: [/^(0|-?([1-9][0-9]*)?)$/, /(0|-?([1-9][0-9]*)?)/],
    uint: [/^(0|([1-9][0-9]*)?)$/, /(0|([1-9][0-9]*)?)/],
    en: [/^[a-zA-Z0-9 _\-<>,.'":;!@#$%^&*()+?=|\\~/[\]{}\r\n]*$/, /[a-zA-Z0-9 _\-<>,.'":;!@#$%^&*()+?=|\\~/[\]{}\r\n]*/],
    'en-word': [/^[a-zA-Z0-9]*$/, /[a-zA-Z0-9]*/],
    phone: [/^[0-9]+(-?[0-9-]+)?$/, /[0-9]+(-?[0-9-]+)?/],
    mobile: [/^[0-9]*$/, /[0-9]*/],
    currency: [/^[0-9]+\.?[0-9]?[0-9]?$/, /[0-9]+\.?[0-9]?[0-9]?/],
    vin: [/^[0-9A-HJ-NPR-Za-hj-npr-z]{0,17}$/, /[0-9A-HJ-NPR-Za-hj-npr-z]{0,17}/]
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

    data() {
      return {
        textareaCalcStyle: {},
        hovering: false,
        focused: false,
        isComposing: false,
        passwordVisible: false
      };
    },

    props: {
      // 自定义匹配规则，自定义之后，inputType就不生效了
      validationRegex: {
        type: Array,
        validator (val) {
          if (!val || val.length !== 2 || !val[0].test || !val[1].test) {
            console.error('validation-regex 必须指定全局匹配和部分匹配 正则表达式')
            return false
          }
          return true
        }
      },
      inputType: {
        type: String
      },
      // upper lower or null
      caseType: null,
      // 获取焦点时选择所有文本
      focusSelectAll: {
        default () {
          return false
        }
      },
      value: [String, Number],
      size: String,
      resize: String,
      form: String,
      disabled: Boolean,
      readonly: Boolean,
      type: {
        type: String,
        default: 'text'
      },
      autosize: {
        type: [Boolean, Object],
        default: false
      },
      autocomplete: {
        type: String,
        default: 'off'
      },
      /** @Deprecated in next major version */
      autoComplete: {
        type: String,
        validator(val) {
          process.env.NODE_ENV !== 'production' &&
          console.warn('[Element Warn][Input]\'auto-complete\' property will be deprecated in next major version. please use \'autocomplete\' instead.');
          return true;
        }
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
      clearableVisibleOnReadonly: {
        type: Boolean,
        default: false
      },
      showPassword: {
        type: Boolean,
        default: false
      },
      showWordLimit: {
        type: Boolean,
        default: false
      },
      tabindex: String
    },

    computed: {
      _elFormItemSize() {
        return (this.elFormItem || {}).elFormItemSize;
      },
      validateState() {
        return this.elFormItem ? this.elFormItem.validateState : '';
      },
      needStatusIcon() {
        return this.elForm ? this.elForm.statusIcon : false;
      },
      validateIcon() {
        return {
          validating: 'el-icon-loading',
          success: 'el-icon-circle-check',
          error: 'el-icon-circle-close'
        }[this.validateState];
      },
      textareaStyle() {
        return merge({}, this.textareaCalcStyle, { resize: this.resize });
      },
      inputSize() {
        return this.size || this._elFormItemSize || (this.$ELEMENT || {}).size;
      },
      inputDisabled() {
        return this.disabled || (this.elForm || {}).disabled;
      },
      nativeInputValue() {
        return this.value === null || this.value === undefined ? '' : String(this.value);
      },
      showClear() {
        return this.clearable &&
          !this.inputDisabled &&
          (!this.readonly || this.clearableVisibleOnReadonly) &&
          this.nativeInputValue &&
          (this.focused || this.hovering);
      },
      showPwdVisible() {
        return this.showPassword &&
          !this.inputDisabled &&
          !this.readonly &&
          (!!this.nativeInputValue || this.focused);
      },
      isWordLimitVisible() {
        return this.showWordLimit &&
          this.$attrs.maxlength &&
          (this.type === 'text' || this.type === 'textarea') &&
          !this.inputDisabled &&
          !this.readonly &&
          !this.showPassword;
      },
      upperLimit() {
        return this.$attrs.maxlength;
      },
      textLength() {
        if (typeof this.value === 'number') {
          return String(this.value).length;
        }

        return (this.value || '').length;
      },
      inputExceed() {
        // show exceed style if length of initial value greater then maxlength
        return this.isWordLimitVisible &&
          (this.textLength > this.upperLimit);
      }
    },

    watch: {
      value(val) {
        this.$nextTick(this.resizeTextarea);
        if (this.validateEvent) {
          this.dispatch('ElFormItem', 'el.form.change', [val]);
        }
      },
      // native input value is set explicitly
      // do not use v-model / :value in template
      // see: https://github.com/ElemeFE/element/issues/14521
      nativeInputValue() {
        this.setNativeInputValue();
      },
      // when change between <input> and <textarea>,
      // update DOM dependent value and styles
      // https://github.com/ElemeFE/element/issues/14857
      type() {
        this.$nextTick(() => {
          this.setNativeInputValue();
          this.resizeTextarea();
          this.updateIconOffset();
        });
      }
    },

    methods: {
      strValid (newValue) {
        if (newValue.length > 0 && (this.validationRegex || (this.inputType && regObj[this.inputType]))) {
          return (this.validationRegex ? this.validationRegex[0] : regObj[this.inputType])[0].test(newValue)
        }
        return true
      },
      focus() {
        const el = this.getInput();
        el && el.focus();
      },
      blur() {
        const el = this.getInput();
        el && el.blur();
      },
      getMigratingConfig() {
        return {
          props: {
            'icon': 'icon is removed, use suffix-icon / prefix-icon instead.',
            'on-icon-click': 'on-icon-click is removed.'
          },
          events: {
            'click': 'click is removed.'
          }
        };
      },
      handleBlur(event) {
        this.focused = false;
        this.$emit('blur', event);
        if (this.validateEvent) {
          this.dispatch('ElFormItem', 'el.form.blur', [this.value]);
        }
      },
      select() {
        this.getInput().select();
      },
      resizeTextarea() {
        if (this.$isServer) return;
        const { autosize, type } = this;
        if (type !== 'textarea') return;
        if (!this.$refs.textarea) return; // 如果被销毁，则此ref为null
        if (!autosize) {
          this.textareaCalcStyle = {
            minHeight: calcTextareaHeight(this.$refs.textarea).minHeight
          };
          return;
        }
        const minRows = autosize.minRows;
        const maxRows = autosize.maxRows;

        this.textareaCalcStyle = calcTextareaHeight(this.$refs.textarea, minRows, maxRows);
      },
      setNativeInputValue() {
        const input = this.getInput();
        if (!input) return;
        if (input.value === this.nativeInputValue) return;
        input.value = this.nativeInputValue;
      },
      handleFocus(event) {
        if (this.focusSelectAll) {
          this.getInput().select()
        }
        this.focused = true;
        this.$emit('focus', event);
      },
      handleCompositionStart() {
        this.isComposing = true;
      },
      handleCompositionEnd(event) {
        this.isComposing = false;
        this.handleInput(event);
      },
      handleInput(event) {
        // should not emit input during composition
        // see: https://github.com/ElemeFE/element/issues/10516
        if (this.isComposing) return;

        // hack for https://github.com/ElemeFE/element/issues/8548
        // should remove the following line when we don't support IE
        if (event.target.value === this.nativeInputValue) return;

        let value = event.target.value || ''
        if (this.caseType) {
          value = this.caseType === 'upper' ? value.toUpperCase() : value.toLowerCase()
        }
        if (this.validationRegex || this.inputType) {
          if (!this.strValid(value)) {
            let reg = (this.validationRegex ? this.validationRegex : regObj[this.inputType])[1]
            let globalReg = new RegExp(reg, 'g')
            let validStrs = _.filter(value.match(globalReg), e => e).join('').match(reg)
            value = validStrs && validStrs[0] || ''
          }
        }

        this.$emit('input', value);

        // ensure native input value is controlled
        // see: https://github.com/ElemeFE/element/issues/12850
        this.$nextTick(this.setNativeInputValue);
      },
      handleChange(event) {
        this.$emit('change', event.target.value);
      },
      calcIconOffset(place) {
        let elList = [].slice.call(this.$el.querySelectorAll(`.el-input__${place}`) || []);
        if (!elList.length) return;
        let el = null;
        for (let i = 0; i < elList.length; i++) {
          if (elList[i].parentNode === this.$el) {
            el = elList[i];
            break;
          }
        }
        if (!el) return;
        const pendantMap = {
          suffix: 'append',
          prefix: 'prepend'
        };

        const pendant = pendantMap[place];
        if (this.$slots[pendant]) {
          el.style.transform = `translateX(${place === 'suffix' ? '-' : ''}${this.$el.querySelector(`.el-input-group__${pendant}`).offsetWidth}px)`;
        } else {
          el.removeAttribute('style');
        }
      },
      updateIconOffset() {
        this.calcIconOffset('prefix');
        this.calcIconOffset('suffix');
      },
      clear() {
        this.$emit('input', '');
        this.$emit('change', '');
        this.$emit('clear');
      },
      handlePasswordVisible() {
        this.passwordVisible = !this.passwordVisible;
        this.focus();
      },
      getInput() {
        return this.$refs.input || this.$refs.textarea;
      },
      getSuffixVisible() {
        return this.$slots.suffix ||
          this.suffixIcon ||
          this.showClear ||
          this.showPassword ||
          this.isWordLimitVisible ||
          (this.validateState && this.needStatusIcon);
      }
    },

    created() {
      this.$on('inputSelect', this.select);
    },

    mounted() {
      this.setNativeInputValue();
      this.resizeTextarea();
      this.updateIconOffset();
    },

    updated() {
      this.$nextTick(this.updateIconOffset);
    }
  };
</script>
