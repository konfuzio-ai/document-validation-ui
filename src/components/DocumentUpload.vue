<template>
  <div class="document-upload">
    <input
      type="file"
      ref="fileInput"
      @change="handleFileUpload"
      accept=".pdf,.jpg,.jpeg,.png,.tiff"
      style="display: none"
    />
    <button class="upload-button" @click="triggerFileInput">
      <i class="fas fa-upload"></i>
      {{ $t('upload_document') }}
    </button>
  </div>
</template>

<script>
import api from '../api';

export default {
  name: 'DocumentUpload',
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await api.HTTP.post('documents/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        this.$emit('document-uploaded', response.data);
        this.$store.dispatch('document/setSelectedDocument', response.data);
      } catch (error) {
        console.error('Error uploading document:', error);
        this.$store.dispatch('document/setShowActionError', true);
      }

      // Reset the file input
      event.target.value = '';
    },
  },
};
</script>

<style scoped lang="scss">
.document-upload {
  margin-right: 1rem;
  
  .upload-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.3s;
    height: 2.5rem;

    &:hover {
      background-color: #45a049;
    }

    i {
      font-size: 1rem;
    }
  }
}
</style> 