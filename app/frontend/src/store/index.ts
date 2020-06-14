import Vue from 'vue'
import Vuex from 'vuex'

import createPersistedState from 'vuex-persistedstate'

Vue.use(Vuex)

export enum AuthenticationState {
  Authenticated = 0,
  None = 1
}

export default new Vuex.Store({
  state: {
    error: null,
    username: null as null | string,
    name: null as null | string,
    auth: AuthenticationState.None,
    authToken: null as null | string
  },
  mutations: {
    auth (state, {authState, authToken}) {
      state.auth = authState
      state.authToken = authToken
    },
    deauth (state) {
      state.auth = AuthenticationState.None
      state.authToken = null
      state.username = null
      state.name = "Not logged in"
    },
    error (state, errorMessage) {
      console.error(errorMessage)
      state.error = errorMessage
    },
    updateUser (state, {username, name}) {
      state.username = username
      state.name = name
    }
  },
  actions: {
  },
  modules: {
  },
  getters: {
    authenticated: state => state.auth == AuthenticationState.Authenticated
  },
  plugins: [createPersistedState()]
})
