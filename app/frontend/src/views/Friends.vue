<template>
  <v-content>
    <v-container fluid>
      <h1>Friends</h1>
      <v-snackbar v-model="errorVisible" color="error">
        {{ errorMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn dark text v-bind="attrs" @click="errorVisible = false">Close</v-btn>
        </template>
      </v-snackbar>
      <v-snackbar v-model="successVisible" color="success">
        {{ successMessage }}
        <template v-slot:action="{ attrs }">
          <v-btn dark text v-bind="attrs" @click="successVisible = false">Close</v-btn>
        </template>
      </v-snackbar>
      <v-card max-width="500">
        <v-toolbar color="primary" dark>
          <v-toolbar-title>Friends</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon>
            <v-icon>mdi-account-multiple</v-icon>
          </v-btn>
        </v-toolbar>
        <v-list subheader>
          <v-subheader>Friend requests</v-subheader>
          <v-list-item v-for="request in requests" :key="request.friendRequestId">
            <v-list-item-content>
              <v-list-item-title v-text="request.userFrom"></v-list-item-title>
              <v-btn color="success" class="mx-2 my-2" @click="respondFriendRequest(request.friendRequestId, true)">Accept</v-btn>
              <v-btn color="error" class="mx-2 my-2" @click="respondFriendRequest(request.friendRequestId, false)">Reject</v-btn>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import Vue from 'vue'

import empty from 'google-protobuf/google/protobuf/empty_pb'

import { FriendRequest, RespondFriendRequestReq } from '../pb/api_pb'
import { client } from '../api'

export default Vue.extend({
  data: () => ({
    loading: false,
    requests: [] as Array<FriendRequest.AsObject>,
    errorMessage: "",
    errorVisible: false,
    successMessage: "",
    successVisible: false,
  }),

  created () {
    this.fetchData()
  },

  methods: {
    fetchData: function () {
      this.loading = true
      this.errorMessage = ""

      const req = new empty.Empty()
      client.listFriendRequests(req, null).then(res => {
        this.loading = false
        this.errorMessage = ""

        this.requests = res.toObject().requestsList
      }).catch(err => {
        this.loading = false
        this.errorMessage = err.message
        this.errorVisible = true
      })
    },

    respondFriendRequest: function (friendRequestId: number, accept: boolean) {
      const req = new RespondFriendRequestReq()
      req.setFriendRequestId(friendRequestId)
      req.setAccept(accept)
      client.respondFriendRequest(req, null).then(res => {
        this.successMessage = "Responded to friend request!"
        this.successVisible = true
        this.fetchData()
      }).catch(err => {
        this.errorMessage = err.message
        this.errorVisible = true
        this.fetchData()
      })
    }
  },
})
</script>
