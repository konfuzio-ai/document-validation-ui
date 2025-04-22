<template>
  <img
    :src="imageData"
    :alt="alt"
    :class="imageClass"
    @error="handleError"
    v-bind="$attrs"
  />
</template>

<script>
import axios from 'axios'

export default {
  name: 'AuthImage',
  props: {
    src: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    imageClass: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      imageData: '',
      loading: true,
      error: null
    }
  },
  methods: {
    async loadImage() {
      try {
        const baseUrl = process.env.VUE_APP_IMAGE_URL || 'https://testing.konfuzio.com'
        const token = process.env.VUE_APP_USER_TOKEN
        const response = await axios.get(`${baseUrl}${this.src}`, {
          responseType: 'blob',
          headers: {
            'Authorization': `Token ${token}`
          }
        })
        this.imageData = URL.createObjectURL(response.data)
      } catch (err) {
        console.error('Error loading image:', err)
        this.error = err
        this.imageData = '' // Clear the image on error
      } finally {
        this.loading = false
      }
    },
    handleError() {
      this.imageData = '' // Clear the image on load error
      console.error('Error loading image:', this.src)
    }
  },
  watch: {
    src: {
      immediate: true,
      handler() {
        this.loadImage()
      }
    }
  },
  beforeDestroy() {
    // Clean up object URL to prevent memory leaks
    if (this.imageData) {
      URL.revokeObjectURL(this.imageData)
    }
  }
}
</script> 