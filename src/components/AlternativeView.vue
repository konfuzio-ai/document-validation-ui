<template>
  <div class="alternative-view-container">
    <div class="view-header">
      <h2>Alternative View</h2>
      <div class="view-controls">
        <button @click="switchView" class="switch-view-btn">
          Switch to Standard View
        </button>
      </div>
    </div>
    
    <div class="view-content">
      <!-- Document content will go here -->
      <div class="document-container" v-if="currentDocument">
        <div class="document-info">
          <h3>{{ currentDocument.name }}</h3>
          <p>ID: {{ currentDocument.id }}</p>
        </div>
        
        <div class="document-actions">
          <button @click="handleAction1" class="action-btn">Action 1</button>
          <button @click="handleAction2" class="action-btn">Action 2</button>
        </div>
        
        <div class="document-content">
          <!-- Add your alternative view specific content here -->
        </div>
      </div>
      
      <div v-else class="no-document">
        <p>No document selected</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import API from '../api';

export default {
  name: 'AlternativeView',
  
  data() {
    return {
      currentDocument: null,
      loading: false,
      error: null
    };
  },
  
  computed: {
    ...mapState({
      documentId: state => state.document.id,
      userToken: state => state.auth.token,
      selectedDocument: state => state.document.selectedDocument
    })
  },
  
  methods: {
    async loadDocument() {
      if (!this.documentId) return;
      
      this.loading = true;
      try {
        // Use the document from the store instead of making a new API call
        this.currentDocument = this.selectedDocument;
      } catch (error) {
        this.error = error.message;
        console.error('Error loading document:', error);
      } finally {
        this.loading = false;
      }
    },
    
    switchView() {
      this.$emit('switch-view', 'standard');
    },
    
    handleAction1() {
      // Implement your alternative view specific action
      console.log('Action 1 clicked');
    },
    
    handleAction2() {
      // Implement your alternative view specific action
      console.log('Action 2 clicked');
    }
  },
  
  watch: {
    documentId: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.loadDocument();
        }
      }
    },
    selectedDocument: {
      immediate: true,
      handler(newDoc) {
        if (newDoc) {
          this.currentDocument = newDoc;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.alternative-view-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      color: var(--text-color);
    }
  }
  
  .view-controls {
    .switch-view-btn {
      padding: 8px 16px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
  
  .view-content {
    flex: 1;
    overflow: auto;
  }
  
  .document-container {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .document-info {
    margin-bottom: 20px;
    
    h3 {
      margin: 0 0 10px 0;
    }
  }
  
  .document-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    
    .action-btn {
      padding: 8px 16px;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      
      &:hover {
        opacity: 0.9;
      }
    }
  }
  
  .no-document {
    text-align: center;
    padding: 40px;
    color: var(--text-lighter);
  }
}
</style> 