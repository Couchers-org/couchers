<template>
  <v-main>
    <v-overlay v-if="loading">
      <loading-circular :loading="loading" />
    </v-overlay>
    <v-container v-if="!loading || this.userCache.length > 0" fluid>
      <h1>Friends</h1>
      <v-snackbar v-model="errorVisible" color="error">
        {{ errorMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn dark text v-bind="attrs" @click="errorVisible = false"
            >Close</v-btn
          >
        </template>
      </v-snackbar>
      <v-snackbar v-model="successVisible" color="success">
        {{ successMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn dark text v-bind="attrs" @click="successVisible = false"
            >Close</v-btn
          >
        </template>
      </v-snackbar>
      <v-row>
        <v-col md="4" xs="12">
          <v-card>
            <v-toolbar color="primary" dark>
              <v-toolbar-title>Your friends</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-icon>mdi-account-multiple</v-icon>
            </v-toolbar>
            <v-list subheader>
              <v-subheader v-if="!friends.length">Empty!</v-subheader>
              <v-list-item
                v-for="friendId in friends"
                :key="friendId"
                link
                :to="{
                  name: 'User',
                  params: { user: userCache[friendId].username },
                }"
              >
                <v-list-item-content>
                  <v-list-item-title
                    v-text="userCache[friendId].name"
                  ></v-list-item-title>
                  <v-list-item-subtitle
                    v-text="handle(userCache[friendId].username)"
                  ></v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col md="4" xs="12">
          <v-card>
            <v-toolbar color="primary" dark>
              <v-toolbar-title>Friend requests</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-icon>mdi-account-multiple-plus</v-icon>
            </v-toolbar>
            <v-list subheader>
              <v-subheader v-if="!receivedRequests.length"
                >No pending friend requests!</v-subheader
              >
              <v-list-item
                v-for="request in receivedRequests"
                :key="request.friendRequestId"
              >
                <v-list-item-content>
                  <v-list-item-title
                    v-text="userCache[request.userId].name"
                  ></v-list-item-title>
                  <router-link
                    :to="{
                      name: 'User',
                      params: { user: userCache[request.userId].username },
                    }"
                  >
                    <v-list-item-subtitle
                      v-text="handle(userCache[request.userId].username)"
                    ></v-list-item-subtitle>
                  </router-link>
                  <v-btn
                    color="success"
                    class="mx-2 my-2"
                    @click="respondFriendRequest(request.friendRequestId, true)"
                    >Accept</v-btn
                  >
                  <v-btn
                    color="error"
                    class="mx-2 my-2"
                    @click="
                      respondFriendRequest(request.friendRequestId, false)
                    "
                    >Reject</v-btn
                  >
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        <v-col md="4" xs="12">
          <v-card>
            <v-toolbar color="primary" dark>
              <v-toolbar-title>Friend requests you sent</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-icon>mdi-account-multiple-plus</v-icon>
            </v-toolbar>
            <v-list subheader>
              <v-subheader v-if="!sentRequests.length"
                >No pending friend requests!</v-subheader
              >
              <v-list-item
                v-for="request in sentRequests"
                :key="request.friendRequestId"
              >
                <v-list-item-content>
                  <v-list-item-title
                    v-text="userCache[request.userId].name"
                  ></v-list-item-title>
                  <router-link
                    :to="{
                      name: 'User',
                      params: { user: userCache[request.userId].username },
                    }"
                  >
                    <v-list-item-subtitle
                      v-text="handle(userCache[request.userId].username)"
                    ></v-list-item-subtitle>
                  </router-link>
                  <v-btn
                    color="error"
                    class="mx-2 my-2"
                    @click="cancelFriendRequest(request.friendRequestId)"
                    >Cancel request</v-btn
                  >
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"

import { handle } from "../utils"

import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import {
  FriendRequest,
  RespondFriendRequestReq,
  CancelFriendRequestReq,
  User,
  GetUserReq,
} from "../pb/api_pb"
import { client } from "../api"

import LoadingCircular from "../components/LoadingCircular.vue"

export default Vue.extend({
  data: () => ({
    loading: true,
    friends: [] as Array<number>,
    receivedRequests: [] as Array<FriendRequest.AsObject>,
    sentRequests: [] as Array<FriendRequest.AsObject>,
    userCache: {} as { [userId: number]: User.AsObject },
    errorMessage: "",
    errorVisible: false,
    successMessage: "",
    successVisible: false,
  }),

  components: {
    LoadingCircular,
  },

  created() {
    this.fetchData()
  },

  methods: {
    handle,

    async fetchData() {
      this.loading = true
      this.errorMessage = ""

      const req = new Empty()
      try {
        const friendsRes = await client.listFriends(req)
        this.friends = friendsRes.getUserIdsList()

        const requestsRes = await client.listFriendRequests(req)
        this.sentRequests = requestsRes.toObject().sentList
        this.receivedRequests = requestsRes.toObject().receivedList

        const userIds = [
          ...this.sentRequests.map((r) => r.userId),
          ...this.receivedRequests.map((r) => r.userId),
          ...this.friends,
        ]
        await Promise.all(
          userIds.map(async (id) => {
            const req = new GetUserReq()
            req.setUser(id.toString())
            const res = await client.getUser(req)
            this.userCache[id] = res.toObject()
          })
        )
        this.loading = false
        this.$store.dispatch("ping")
      } catch (err) {
        this.loading = false
        this.errorMessage = err.message
        this.errorVisible = true
      }
    },

    async respondFriendRequest(friendRequestId: number, accept: boolean) {
      const req = new RespondFriendRequestReq()
      req.setFriendRequestId(friendRequestId)
      req.setAccept(accept)
      try {
        await client.respondFriendRequest(req)
        this.successMessage = "Responded to friend request!"
        this.successVisible = true
        this.fetchData()
      } catch (err) {
        this.errorMessage = err.message
        this.errorVisible = true
      }
    },

    async cancelFriendRequest(friendRequestId: number) {
      const req = new CancelFriendRequestReq()
      req.setFriendRequestId(friendRequestId)
      try {
        await client.cancelFriendRequest(req)
        this.successMessage = "Request cancelled!"
        this.successVisible = true
        this.fetchData()
      } catch (err) {
        this.errorMessage = err.message
        this.errorVisible = true
      }
    },
  },
})
</script>
