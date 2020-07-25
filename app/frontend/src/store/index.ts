import Vue from "vue"
import Vuex from "vuex"

import createPersistedState from "vuex-persistedstate"

import { User, PingReq } from "../pb/api_pb"
import { client } from "../api"

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    error: null,
    user: null as null | User.AsObject,
    authToken: null as null | string,
  },
  mutations: {
    auth(state, { authToken }) {
      state.authToken = authToken
    },
    deauth(state) {
      state.authToken = null
      state.user = null
    },
    error(state, errorMessage) {
      console.error(errorMessage)
      state.error = errorMessage
    },
    updateUser(state, { user }) {
      state.user = user
    },
  },
  actions: {
    auth(ctx, { authToken }) {
      ctx.commit("auth", { authToken })
      ctx.dispatch("refreshUser")
    },
    refreshUser(ctx) {
      client
        .ping(new PingReq())
        .then((res) => {
          ctx.commit("updateUser", {
            user: res.getUser()!.toObject(),
          })
        })
        .catch((err) => {
          console.error("Failed to ping server: ", err)
        })
    },
  },
  modules: {},
  getters: {
    authenticated: (state) => state.authToken !== null,
  },
  plugins: [createPersistedState()],
})
