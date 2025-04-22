<template>
  <div class="auth-image-container">
    <img
      v-if="imageData && !error"
      :src="imageData"
      :alt="alt"
      :class="imageClass"
      @error="handleError"
      v-bind="$attrs"
    />
    <div v-else-if="loading" class="loading-placeholder">
      <b-skeleton width="100%" height="100%" />
    </div>
    <div v-else-if="error" class="error-placeholder">
      <b-icon icon="image" />
      <span>{{ error.message || 'Failed to load image' }}</span>
    </div>
  </div>
</template>

<script>
import api from '@/api'

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
      if (!this.src) {
        this.error = new Error('No image source provided')
        this.loading = false
        return
      }

      try {
        this.loading = true
        this.error = null
        const response = await api.makeFileRequest(this.src)
        
        // Handle axios response which contains the blob in response.data
        const blob = response.data
        if (blob instanceof Blob) {
          this.imageData = URL.createObjectURL(blob)
        } else {
          throw new Error('Invalid image response format')
        }
      } catch (err) {
        console.error('Error loading image:', err)
        this.error = err
        this.imageData = '' // Clear the image on error
      } finally {
        this.loading = false
      }
    },
    handleError(event) {
      console.error('Image load error:', event)
      this.imageData = '' // Clear the image on load error
      let errorMessage = 'Failed to load image'
      if (event && event.target && event.target.error && event.target.error.message) {
        errorMessage = event.target.error.message
      }
      this.error = new Error(errorMessage)
    }
  },
  watch: {
    src: {
      immediate: true,
      handler(newSrc) {
        console.log('Source changed to:', newSrc)
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

<style scoped>
.auth-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100px;
}

.loading-placeholder,
.error-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.error-placeholder {
  color: #666;
  gap: 8px;
  padding: 8px;
  text-align: center;
}

.error-placeholder .b-icon {
  font-size: 24px;
}
</style> 