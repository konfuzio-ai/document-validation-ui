<template>
  <div class="settings">
    <h1>Settings</h1>
    
    <div class="card">
      <div class="card-header">
        <h2>API Configuration</h2>
      </div>
      
      <div class="settings-form">
        <div class="form-group">
          <label for="apiUrl">API URL</label>
          <input 
            type="text" 
            id="apiUrl" 
            v-model="apiUrl" 
            placeholder="Enter API URL"
            @change="updateApiUrl"
          >
        </div>
        
        <div class="form-group">
          <label for="userToken">Authentication Token</label>
          <input 
            type="password" 
            id="userToken" 
            v-model="userToken" 
            placeholder="Enter authentication token"
            @change="updateUserToken"
          >
        </div>
        
        <div class="form-group">
          <label for="imageUrl">Image URL</label>
          <input 
            type="text" 
            id="imageUrl" 
            v-model="imageUrl" 
            placeholder="Enter image URL"
            @change="updateImageUrl"
          >
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h2>Connection Status</h2>
        <button @click="checkConnection" class="refresh-btn" :disabled="checking">
          {{ checking ? 'Checking...' : 'Check Connection' }}
        </button>
      </div>
      
      <div v-if="connectionError" class="error-message">
        {{ connectionError }}
      </div>
      
      <div v-else-if="connectionStatus" class="status-message success">
        Connected successfully to {{ apiUrl }}
      </div>
      
      <div v-else class="status-message">
        Click "Check Connection" to verify your settings
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapMutations } from 'vuex'
import { HTTP } from '@/api'

export default {
  name: 'Settings',
  data() {
    return {
      checking: false,
      connectionError: null,
      connectionStatus: false
    }
  },
  computed: {
    ...mapState({
      apiUrl: state => state.apiUrl,
      userToken: state => state.userToken,
      imageUrl: state => state.imageUrl
    })
  },
  methods: {
    ...mapMutations([
      'SET_API_URL',
      'SET_USER_TOKEN',
      'SET_IMAGE_URL'
    ]),
    updateApiUrl() {
      this.SET_API_URL(this.apiUrl)
      this.checkConnection()
    },
    updateUserToken() {
      this.SET_USER_TOKEN(this.userToken)
      this.checkConnection()
    },
    updateImageUrl() {
      this.SET_IMAGE_URL(this.imageUrl)
    },
    async checkConnection() {
      this.checking = true
      this.connectionError = null
      this.connectionStatus = false
      
      try {
        // Try to fetch a simple endpoint to verify connection
        await HTTP.get('/api/health')
        this.connectionStatus = true
      } catch (error) {
        this.connectionError = error.response && error.response.data && error.response.data.message 
          ? error.response.data.message 
          : 'Failed to connect to API'
      } finally {
        this.checking = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.settings {
  max-width: 800px;
  margin: 0 auto;
  
  h1 {
    margin-bottom: 1.5rem;
  }
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    
    h2 {
      margin: 0;
      color: #41af85;
    }
  }
}

.settings-form {
  .form-group {
    margin-bottom: 1.5rem;
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: #333;
    }
    
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      
      &:focus {
        outline: none;
        border-color: #41af85;
        box-shadow: 0 0 0 2px rgba(65, 175, 133, 0.2);
      }
      
      &::placeholder {
        color: #999;
      }
    }
  }
}

.error-message {
  background-color: #fdf4f6;
  color: #e7423a;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.status-message {
  padding: 1rem;
  border-radius: 4px;
  background-color: #f7f7f7;
  color: #666;
  
  &.success {
    background-color: #f0f9f4;
    color: #41af85;
  }
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &.refresh-btn {
    background-color: #f0f0f0;
    color: #333;
    
    &:hover {
      background-color: #e0e0e0;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
</style> 