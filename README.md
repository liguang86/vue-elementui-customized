## 说明

### ElementUI

使用时，需要在 `vue.config.js` 中配置 alias 如下(因为在Element源码内部，也使用了 elementui 别名)：

    ```
    const path = require('path')
    
    function resolve (dir) {
      return path.join(__dirname, dir)
    }
    
    module.exports = {
      runtimeCompiler: true,
      chainWebpack: (config) => {
        config.resolve.alias
          .set('element-ui', resolve(''@liguang/vue-elementui-customized/src/elementui'))
      }
    }
    ```

自定义了Input、InputNumber、Loading、Tooltip、Upload 以及 Clickoutside，详见相应目录的 `readme.md`

### Modal部分

如果注入router，当页面切换时，弹框会自动关闭。
此模块大大方便了Modal的使用，使用方式如下：

    1. 编写Modal组件
    
        ```
        // TestModal.vue
        <template>
            <el-dialog title="测试">
                // 省略
            </el-dialog>
        </template>
        <script>
        import ModalMixin from '@liguang/vue-elementui-customized/modal/modal-mixin'
        export default {
          mixins: [ModalMixin],
          methods: {
            init (arg0, arg1, ....) {
              // 这里必须返回 this.open()
              return this.open()
            }
          }
        }
        </script>
        ```

    2. 初始化
        
        ```
        import Modal from '@liguang/vue-elementui-customized/modal'
        // 参数为待注入的对象，是可选项
        Modal.initModal({
          store,
          router
        })
        Vue.use(Modal)
        ```
        
    3. 注册Modal组件
        ```
        import TestModal from './models/TestModal.vue'
        import Modal from '@liguang/vue-elementui-customized/modal'
        
        let modals = {
          TestModal
        }
        for (let key in modals) {
          if (modals.hasOwnProperty(key)) {
            Modal.registerModal(key, modals[key])
          }
        }
        ```
    4. 使用
    
        ```
        import Vue from 'vue'
        let rst = Vue.prototype.modal('TestModal', arg0, arg1, ...)
        // 这里返回值中包含 modal 实例，以及 promise（当Modal关闭时，主动调用关闭时会执行resolve，参数为close方法调用时的参数, 非主动调用关闭时执行reject(-1)
        console.log(rst.modal)
        rst.promise.then(data => {
          console.log(data)
        }).catch(err => {
          console.log(err)
        })
        ```
        
### 示例

[查看示例](https://liguang86.github.io/vue-elementui-customized/dist/)
