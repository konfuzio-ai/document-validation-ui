<template>
  <div class="home">
    <h1>Welcome to the Inspector View</h1>
    <p>This is a standalone application that connects to the Konfuzio API.</p>
    
    <div class="card">
      <h2>Getting Started</h2>
      <p>Use the navigation menu to explore documents and settings.</p>
      <p>You can configure the API connection in the Settings page.</p>
    </div>
    
    <div class="card">
      <h2>API Status</h2>
      <div class="api-status">
        <div class="status-item">
          <span class="label">API URL:</span>
          <span class="value">{{ apiUrl }}</span>
        </div>
        <div class="status-item">
          <span class="label">Authentication:</span>
          <span class="value">{{ userToken ? 'Configured' : 'Not configured' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Home',
  computed: {
    ...mapState({
      apiUrl: state => state.apiUrl,
      userToken: state => state.userToken
    })
  }
}
</script>

<style lang="scss" scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  
  h1 {
    margin-bottom: 1rem;
  }
  
  p {
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  
  h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: #41af85;
  }
}

.api-status {
  .status-item {
    display: flex;
    margin-bottom: 0.5rem;
    
    .label {
      font-weight: bold;
      width: 120px;
    }
    
    .value {
      word-break: break-all;
    }
  }
}
</style> 