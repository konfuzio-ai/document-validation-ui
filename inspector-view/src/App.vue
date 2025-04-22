<template>
  <div id="app">
    <TokenInput 
      v-if="!hasToken" 
      @token-saved="handleTokenSaved"
    />
    <template v-else>
      <nav class="navbar">
        <div class="navbar-brand">
          <h1>Inspector View</h1>
        </div>
        <div class="navbar-menu">
          <router-link to="/" class="navbar-item">Home</router-link>
          <router-link to="/documents" class="navbar-item">Documents</router-link>
        </div>
      </nav>
      <main class="main-content">
        <router-view/>
      </main>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import TokenInput from './components/TokenInput.vue'

export default {
  name: 'App',
  components: {
    TokenInput
  },
  computed: {
    ...mapState(['userToken']),
    hasToken() {
      return !!this.userToken
    }
  },
  methods: {
    ...mapActions(['initializeAuth']),
    ...mapMutations(['SET_USER_TOKEN']),
    handleTokenSaved(token) {
      this.SET_USER_TOKEN(token)
    }
  },
  created() {
    this.initializeAuth()
  }
}
</script>

<style lang="scss">
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}
  
  .navbar-brand {
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
  }
  
  .navbar-menu {
    display: flex;
    gap: 1rem;
}
    
    .navbar-item {
      text-decoration: none;
  color: #495057;
      padding: 0.5rem 1rem;
  border-radius: 0.25rem;
      
      &:hover {
    background-color: #e9ecef;
  }
}

.main-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}
</style> 