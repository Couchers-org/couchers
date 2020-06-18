import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
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
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/signup/',
    name: 'Signup',
    component: Signup
  },
  {
    path: '/signup/:token',
    name: 'CompleteSignup',
    component: CompleteSignup
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/login/:token',
    name: 'CompleteLogin',
    component: CompleteLogin
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
