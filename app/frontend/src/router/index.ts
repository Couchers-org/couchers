import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'
import Messages from '../views/Messages.vue'
import User from '../views/User.vue'
import Users from '../views/Users.vue'
import Friends from '../views/Friends.vue'
import About from '../views/About.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages
  },
  {
    path: '/user',
    name: 'Users',
    component: Users
  },
  {
    path: '/user/:id',
    name: 'User',
    component: User
  },
  {
    path: '/friends',
    name: 'Friends',
    component: Friends
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
