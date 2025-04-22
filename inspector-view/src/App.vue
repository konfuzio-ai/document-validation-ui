<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-brand">
        <h1>Inspector View</h1>
      </div>
      <div class="navbar-menu">
        <router-link to="/" class="navbar-item">Home</router-link>
        <router-link to="/documents" class="navbar-item">Documents</router-link>
        <router-link to="/settings" class="navbar-item">Settings</router-link>
      </div>
    </nav>
    <main class="main-content">
      <router-view/>
    </main>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #41af85;
  color: white;
  
  .navbar-brand {
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
  }
  
  .navbar-menu {
    display: flex;
    gap: 1rem;
    
    .navbar-item {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
      
      &.router-link-active {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow: auto;
}
</style> 