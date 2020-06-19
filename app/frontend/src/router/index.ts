import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Store from '../store'
import Home from '../views/Home.vue'
import Messages from '../views/Messages.vue'
import User from '../views/User.vue'
import Users from '../views/Users.vue'
import Friends from '../views/Friends.vue'
import About from '../views/About.vue'
import Login from '../views/Login.vue'
import Profile from '../views/Profile.vue'
import Logout from '../views/Logout.vue'
import SSO from '../views/SSO.vue'
import Signup from '../views/Signup.vue'
import CompleteLogin from '../views/CompleteLogin.vue'
import CompleteSignup from '../views/CompleteSignup.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/signup/',
    name: 'Signup',
    component: Signup,
    meta: { noAuth: true }
  },
  {
    path: '/signup/:token',
    name: 'CompleteSignup',
    component: CompleteSignup,
    meta: { noAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { noAuth: true }
  },
  {
    path: '/login/:token',
    name: 'CompleteLogin',
    component: CompleteLogin,
    meta: { noAuth: true }
  },

  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/sso',
    name: 'SSO',
    component: SSO
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout
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
    path: '/user/:user',
    name: 'User',
    component: User
  },
  {
    path: '/friends',
    name: 'Friends',
    component: Friends
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

router.beforeEach((to, from, next) => {
  if (!to.matched.some(record => record.meta.noAuth) && !Store.getters.authenticated) {
    next({ name: 'Login', params: { reason: 'Please log in to continue' } })
  } else {
    next()
  }
})

export default router
