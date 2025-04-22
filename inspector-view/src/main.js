import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/scss/main.scss'

Vue.config.productionTip = false

// Initialize auth token from localStorage or environment variable
const token = localStorage.getItem('VUE_APP_USER_TOKEN') || process.env.VUE_APP_USER_TOKEN
console.log('Token from storage:', localStorage.getItem('VUE_APP_USER_TOKEN'))
console.log('Token from env:', process.env.VUE_APP_USER_TOKEN)
console.log('Combined token:', token)

// Initialize the app
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app') 