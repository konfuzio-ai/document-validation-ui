<template>
  <div class="token-input-container">
    <div class="token-form">
      <h2>Enter Your API Token</h2>
      <p class="description">Please enter your API token to access the document validation system.</p>
      <div class="input-group">
        <input 
          type="text" 
          v-model="token"
          placeholder="Enter your API token"
          @keyup.enter="saveToken"
          class="token-input"
        />
        <button 
          @click="saveToken"
          :disabled="!token"
          class="save-token-btn"
        >
          Save Token
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations } from 'vuex'

export default {
  name: 'TokenInput',
  data() {
    return {
      token: ''
    }
  },
  methods: {
    ...mapMutations(['SET_USER_TOKEN']),
    saveToken() {
      if (!this.token) return;
      
      // Save token using Vuex mutation
      this.SET_USER_TOKEN(this.token);
      
      // Emit the token value to parent
      this.$emit('token-saved', this.token);
    }
  }
}
</script>

<style scoped>
.token-input-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  z-index: 1000;
}

.token-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  text-align: center;
}

.description {
  color: #666;
  margin-bottom: 1.5rem;
  text-align: center;
}

.input-group {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.token-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.token-input:focus {
  outline: none;
  border-color: #41af85;
  box-shadow: 0 0 0 2px rgba(65, 175, 133, 0.2);
}

.save-token-btn {
  padding: 0.75rem 1.5rem;
  background-color: #41af85;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.save-token-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.save-token-btn:not(:disabled):hover {
  background-color: #368c6c;
}
</style> 