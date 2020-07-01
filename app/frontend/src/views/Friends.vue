<template>
  <v-content>
    <v-container fluid>
      <h1>Friends</h1>

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

import { FriendRequest, RespondFriendRequestReq, FriendRequestStatus } from '../pb/api_pb'
import { client } from '../api'

export default Vue.extend({
  data: () => ({
    loading: false,
    requests: [] as Array<FriendRequest.AsObject>,
    errorMessages: [] as Array<string>
  }),

  created () {
    this.fetchData()
  },

  methods: {
    fetchData: function () {
      this.loading = true
      this.errorMessages = []

      const req = new empty.Empty()
      client.listFriendRequests(req, null).then(res => {
        this.loading = false
        this.errorMessages = []

        this.requests = res.toObject().requestsList
      }).catch(err => {
        this.loading = false
        this.errorMessages = err.message
      })
    },

    respondFriendRequest: function (friendRequestId: number, accept: boolean) {
      const req = new RespondFriendRequestReq()
      req.setFriendRequestId(friendRequestId)
      req.setAccept(accept)
      client.respondFriendRequest(req, null).then(res => {
        console.log(res)
        console.log("Done")
      }).catch(console.error)
      console.log("sending friend request")
    }
  },
})
</script>
