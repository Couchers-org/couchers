<template>
  <v-content>
    <v-container fluid>
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
      <v-card>
        <v-toolbar color="primary" dark>
          <v-toolbar-title>Your friends</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-icon>mdi-account-multiple</v-icon>
        </v-toolbar>
        <v-list subheader>
          <v-subheader v-if="!friends.length">Empty!</v-subheader>
          <v-list-item v-for="friend in friends" :key="friend">
            <v-list-item-content>
              <v-list-item-title v-text="friend"></v-list-item-title>
              <v-btn
                color="primary"
                class="mx-2 my-2"
                link
                :to="{ name: 'User', params: { user: friend } }"
                >Profile</v-btn
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
      <v-card class="mt-5">
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
              <v-list-item-title v-text="request.user"></v-list-item-title>
              <v-btn
                color="success"
                class="mx-2 my-2"
                @click="respondFriendRequest(request.friendRequestId, true)"
                >Accept</v-btn
              >
              <v-btn
                color="error"
                class="mx-2 my-2"
                @click="respondFriendRequest(request.friendRequestId, false)"
                >Reject</v-btn
              >
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
      <v-card class="mt-5">
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
              <v-list-item-title v-text="request.user"></v-list-item-title>
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
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from "vue"

import { Empty } from "google-protobuf/google/protobuf/empty_pb"

import State from "../store"

import {
  FriendRequest,
  RespondFriendRequestReq,
  CancelFriendRequestReq,
} from "../pb/api_pb"
import { client } from "../api"

export default Vue.extend({
  data: () => ({
    loading: false,
    friends: [] as Array<string>,
    receivedRequests: [] as Array<FriendRequest.AsObject>,
    sentRequests: [] as Array<FriendRequest.AsObject>,
    errorMessage: "",
    errorVisible: false,
    successMessage: "",
    successVisible: false,
  }),

  created() {
    this.fetchData()
  },

  methods: {
    fetchData() {
      this.loading = true
      this.errorMessage = ""

      const req = new Empty()
      client
        .listFriends(req)
        .then((res) => {
          this.loading = false
          this.errorMessage = ""
          this.friends = res.getUsersList()
        })
        .catch((err) => {
          this.loading = false
          this.errorMessage = err.message
          this.errorVisible = true
        })

      client
        .listFriendRequests(req)
        .then((res) => {
          this.loading = false
          this.errorMessage = ""

          this.sentRequests = res.toObject().sentList
          this.receivedRequests = res.toObject().receivedList
        })
        .catch((err) => {
          this.loading = false
          this.errorMessage = err.message
          this.errorVisible = true
        })
    },

    respondFriendRequest(friendRequestId: number, accept: boolean) {
      const req = new RespondFriendRequestReq()
      req.setFriendRequestId(friendRequestId)
      req.setAccept(accept)
      client
        .respondFriendRequest(req)
        .then((res) => {
          this.successMessage = "Responded to friend request!"
          this.successVisible = true
          this.fetchData()
        })
        .catch((err) => {
          this.errorMessage = err.message
          this.errorVisible = true
          this.fetchData()
        })
    },

    cancelFriendRequest(friendRequestId: number) {
      const req = new CancelFriendRequestReq()
      req.setFriendRequestId(friendRequestId)
      client
        .cancelFriendRequest(req)
        .then((res) => {
          this.successMessage = "Request cancelled!"
          this.successVisible = true
          this.fetchData()
        })
        .catch((err) => {
          this.errorMessage = err.message
          this.errorVisible = true
          this.fetchData()
        })
    },
  },
})
</script>
