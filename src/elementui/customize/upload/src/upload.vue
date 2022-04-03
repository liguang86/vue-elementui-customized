<script>
import ajax from './ajax';
import UploadDragger from './upload-dragger.vue';

let compressImageFile = (file, maxPix, quality) => {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
      let dataUrl = e.target.result;
      let img = document.createElement('img');
      img.src = dataUrl;
      img.onload = () => {
        let cvs = document.createElement('canvas')
        let scale = 1
        if (img.naturalWidth > maxPix || img.naturalHeight > maxPix) {
          if (img.naturalWidth > img.naturalHeight) {
            scale = maxPix / img.naturalWidth
          } else {
            scale = maxPix / img.naturalHeight
          }
        }
        cvs.width = img.naturalWidth * scale
        cvs.height = img.naturalHeight * scale
        let ctx = cvs.getContext('2d')
        ctx.drawImage(img, 0, 0, cvs.width, cvs.height)
        let base64DataURL = cvs.toDataURL(file.type, quality || 1)
        if (base64DataURL) {
          const buffer = atob(base64DataURL.split(',')[1]).split('').map((char) => char.charCodeAt(0))
          const blob = new Blob([new Uint8Array(buffer)], {type: file.type})
          resolve(blob)
        } else {
          reject(new Error('err'))
        }
      }
    }
  })
}

export default {
  inject: ['uploader'],
  components: {
    UploadDragger
  },
  props: {
    type: String,
    action: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'file'
    },
    data: Object,
    headers: Object,
    withCredentials: Boolean,
    multiple: Boolean,
    accept: String,
    onStart: Function,
    onProgress: Function,
    onSuccess: Function,
    onError: Function,
    beforeUpload: Function,
    drag: Boolean,
    onPreview: {
      type: Function,
      default: function() {}
    },
    onRemove: {
      type: Function,
      default: function() {}
    },
    fileList: Array,
    autoUpload: Boolean,
    listType: String,
    httpRequest: {
      type: Function,
      default: ajax
    },
    disabled: Boolean,
    limit: Number,
    onExceed: Function,
    maxPix: {
      default: 1024,
      type: Number
    },
    quality: {
      default: 1,
      type: Number
    },
    maxSize: {
      default: 2048,
      type: Number
    },
    compressImage: {
      default: true,
      type: Boolean
    },
    notImage: {
      default: false,
      type: Boolean
    }
  },

  data() {
    return {
      mouseover: false,
      reqs: {}
    };
  },

  methods: {
    isImage(str) {
      return str.indexOf('image') !== -1;
    },
    handleChange(ev) {
      const files = ev.target.files;

      if (!files) return;
      this.uploadFiles(files);
    },
    uploadFiles(files) {
      if (this.limit && this.fileList.length + files.length > this.limit) {
        this.onExceed && this.onExceed(files, this.fileList);
        return;
      }

      let postFiles = Array.prototype.slice.call(files);
      if (!this.multiple) { postFiles = postFiles.slice(0, 1); }

      if (postFiles.length === 0) { return; }

      postFiles.forEach(rawFile => {
        this.onStart(rawFile);
        if (this.autoUpload) this.upload(rawFile);
      });
    },
    upload(rawFile) {
      this.$refs.input.value = null;

      let originalRawFile = rawFile

      let done = rawFile => {
        if (!this.beforeUpload) {
          return this.post(rawFile);
        }

        const before = this.beforeUpload(rawFile);

        if (before && before.then) {
          before.then(processedFile => {
            const fileType = Object.prototype.toString.call(processedFile);

            if (fileType === '[object File]' || fileType === '[object Blob]') {
              if (fileType === '[object Blob]') {
                processedFile = new File([processedFile], rawFile.name, {
                  type: rawFile.type
                });
              }
              for (const p in rawFile) {
                if (rawFile.hasOwnProperty(p)) {
                  processedFile[p] = rawFile[p];
                }
              }
              this.post(processedFile);
            } else {
              this.post(rawFile);
            }
          }, () => {
            this.onRemove(null, originalRawFile);
          });
        } else if (before !== false) {
          this.post(rawFile);
        } else {
          this.onRemove(null, originalRawFile);
        }
      }

      if (this.isImage(originalRawFile.type)) {
        debugger
        if (this.compressImage) {
          // 压缩图片
          compressImageFile(originalRawFile, this.maxPix || 1000, this.quality || 1).then(rawFile => {
            rawFile.name = originalRawFile.name
            rawFile.uid = originalRawFile.uid

            if (this.maxSize !== -1 && rawFile.size > this.maxSize * 1000) {
              this.onError('您的图片太大了，请处理后再上传', originalRawFile);
              return
            }

            done(rawFile)
          }).catch(() => {
            this.onError('图片处理出错', originalRawFile);
          })
        } else {
          if (this.maxSize !== -1 && originalRawFile.size > this.maxSize * 1000) {
            this.onError('您的图片太大了，请处理后再上传', originalRawFile);
            return
          }

          done(originalRawFile)
        }
      } else {
        if (!this.notImage) {
          this.onError('请选择图片文件', originalRawFile);
          return
        }
        if (this.maxSize !== -1 && originalRawFile.size > this.maxSize * 1000) {
          this.onError(`最大上传限制为${this.maxSize / 1024}M`, originalRawFile);
          return
        }
        done(originalRawFile)
      }
    },
    abort(file) {
      const { reqs } = this;
      if (file) {
        let uid = file;
        if (file.uid) uid = file.uid;
        if (reqs[uid]) {
          reqs[uid].abort();
        }
      } else {
        Object.keys(reqs).forEach((uid) => {
          if (reqs[uid]) reqs[uid].abort();
          delete reqs[uid];
        });
      }
    },
    post(rawFile) {
      const { uid } = rawFile;
      const options = {
        headers: this.headers,
        withCredentials: this.withCredentials,
        file: rawFile,
        data: this.data,
        filename: this.name,
        action: this.action,
        onProgress: e => {
          this.onProgress(e, rawFile);
        },
        onSuccess: res => {
          if (res.statusCode + '' !== '200') {
            this.onError(res.errorMessage || '上传失败', rawFile)
          } else {
            this.onSuccess(res, rawFile);
          }
          delete this.reqs[uid];
        },
        onError: err => {
          this.onError(err, rawFile);
          delete this.reqs[uid];
        }
      };
      const req = this.httpRequest(options);
      this.reqs[uid] = req;
      if (req && req.then) {
        req.then(options.onSuccess, options.onError);
      }
    },
    handleClick() {
      if (!this.disabled) {
        this.$refs.input.value = null;
        this.$refs.input.click();
      }
    },
    handleKeydown(e) {
      if (e.target !== e.currentTarget) return;
      if (e.keyCode === 13 || e.keyCode === 32) {
        this.handleClick();
      }
    }
  },

  render(h) {
    let {
      handleClick,
      drag,
      name,
      handleChange,
      multiple,
      accept,
      listType,
      uploadFiles,
      disabled,
      handleKeydown
    } = this;
    const data = {
      class: {
        'el-upload': true
      },
      on: {
        click: handleClick,
        keydown: handleKeydown
      }
    };
    data.class[`el-upload--${listType}`] = true;
    if (!this.limit || this.limit > this.fileList.length) {
      return (
        <div {...data} tabindex="0">
          {
            drag
              ? <upload-dragger disabled={disabled} on-file={uploadFiles}>{this.$slots.default}</upload-dragger>
              : this.$slots.default
          }
          <input class="el-upload__input" type="file" ref="input" name={name} on-change={handleChange}
                 multiple={multiple} accept={accept}></input>
        </div>
      );
    } else {
      return null
    }
  }
};
</script>
