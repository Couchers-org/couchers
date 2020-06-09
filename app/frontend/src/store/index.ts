import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export enum AuthenticationState {
  Authenticated = 0,
  None = 1
}

export default new Vuex.Store({
  state: {
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
    }
  },
  actions: {
  },
  modules: {
  },
  getters: {
    authenticated: state => state.auth == AuthenticationState.Authenticated
  }
})
