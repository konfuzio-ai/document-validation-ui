import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Documents from '../views/Documents.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/documents',
    name: 'Documents',
    component: Documents
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router 