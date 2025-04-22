import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/scss/main.scss'

Vue.config.productionTip = false

// Initialize auth token from environment variable
store.commit('SET_USER_TOKEN', process.env.VUE_APP_USER_TOKEN)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app') 