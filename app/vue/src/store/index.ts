import Vue from "vue"
import Vuex, { Store } from "vuex"

import createPersistedState from "vuex-persistedstate"

import Router from "../router"

import { StatusCode } from "grpc-web"

import { User, PingReq, PingRes } from "../pb/api_pb"
import { AuthRes } from "../pb/auth_pb"
import { JailInfoReq, JailInfoRes } from "@/pb/jail_pb"
import { client, jailClient } from "../api"

Vue.use(Vuex)

// how often to ping server
const PING_FREQ = 10000 // ms
// how much slack we allow in this (we try to schedule every PING_FREQ ms, but
// if we're called early/whatever, we won't wait if we're closer than PING_SLACK
// to PING_FREQ)
const PING_SLACK = 100 // ms

export default new Vuex.Store({
  state: {
    error: null,
    drawerOpen: true, // whether the drawer (left hand sidebar) should be open
    user: null as null | User.AsObject,
    unseenHostRequestCount: 0,
    unseenMessageCount: 0,
    pendingFriendRequestCount: 0,
    authToken: null as null | string,
    jailed: false,
    lastPing: 0,
    pingTimeout: null as null | number,
  },
  mutations: {
    auth(state, authRes: AuthRes) {
      state.authToken = authRes.getToken()
      state.jailed = authRes.getJailed()
    },
    deauth(state, reason) {
      state.authToken = null
      state.jailed = false
      state.user = null
      Router.push({
        name: "Login",
        params: { reason: reason || "You were logged out." },
      })
    },
    jail(state, isJailed) {
      state.jailed = isJailed
    },
    updateDrawerOpen(state, drawerOpen) {
      state.drawerOpen = drawerOpen
    },
    error(state, errorMessage) {
      console.error(errorMessage)
      state.error = errorMessage
    },
    updatePing(state, res: PingRes.AsObject) {
      state.user = res.user!
      state.unseenHostRequestCount = res.unseenHostRequestCount
      state.unseenMessageCount = res.unseenMessageCount
      state.pendingFriendRequestCount = res.pendingFriendRequestCount
    },
    clearPingTimeout(state) {
      if (state.pingTimeout) {
        clearTimeout(state.pingTimeout!)
      }
    },
    setPingTimeout(state, timeout) {
      state.pingTimeout = timeout
    },
    updateLastPing(state) {
      state.lastPing = new Date().getTime()
    },
  },
  actions: {
    auth(ctx, authRes: AuthRes) {
      ctx.commit("auth", authRes)
      ctx.dispatch("refreshUser")
    },
    async ping(ctx) {
      // gets a whole bunch of latest info from server if logged in
      ctx.commit("updateLastPing")
      if (ctx.getters.authenticated) {
        if (ctx.getters.jailed) {
          try {
            const res = await jailClient.jailInfo(new JailInfoReq())
            console.log("Jailed: ", res.toObject())
            // just look at first one for now
            if (res.getReasonsList().length == 0) {
              // not jailed anymore
              ctx.commit("jail", false)
              ctx.dispatch("ping")
              Router.push({ name: "Home" })
            } else {
              const reason = res.getReasonsList()[0]
              if (reason === JailInfoRes.JailReason.MISSING_TOS) {
                Router.push({
                  name: "TOS",
                })
              }
            }
          } catch (err) {
            console.error("Failed to ping server (jailed): ", err)
            if (err.code == StatusCode.UNAUTHENTICATED) {
              console.error("Not logged in. Deauthing.")
              ctx.commit("deauth")
            }
          }
        } else {
          try {
            const res = await client.ping(new PingReq())
            ctx.commit("updatePing", res.toObject())
          } catch (err) {
            console.error("Failed to ping server: ", err)
            if (err.code == StatusCode.UNAUTHENTICATED) {
              console.error("Not logged in. Deauthing.")
              ctx.commit("deauth")
            }
          }
        }
      }
    },
    scheduler(ctx) {
      // schedules pinging and makes sure it's run as close to every PING_FREQ
      // as possible

      // clear any timeout to stop having multiple loops
      ctx.commit("clearPingTimeout")

      const now = new Date()

      // whether we'll run now or skip
      let skip = true

      // how long we should wait til trying to see whether to run ping or not
      let nextPingTimeout = PING_FREQ

      const diff = PING_FREQ - (now.getTime() - ctx.state.lastPing || 0)

      if (diff > PING_SLACK) {
        // if we ran faster than expected, wait a bit
        nextPingTimeout = Math.max(diff, 1)
      } else {
        // if we haven't pinged before or it's been longer than
        // PING_FREQ - PING_SLACK, do ping
        skip = false
      }

      // schedule next ping
      ctx.commit(
        "setPingTimeout",
        setTimeout(() => {
          ctx.dispatch("scheduler")
        }, nextPingTimeout)
      )

      if (!skip) {
        // if not skipping, do the ping
        ctx.dispatch("ping")
      }
    },
    refreshUser(ctx) {
      // call refreshUser if you're refreshing the user...
      // the fact that it calls ping is an ipml detail
      ctx.dispatch("ping")
    },
  },
  modules: {},
  getters: {
    authenticated: (state) => state.authToken !== null,
    jailed: (state) => state.jailed === true,
  },
  plugins: [createPersistedState()],
})
