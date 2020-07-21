<template>
  <v-main>
    <v-container fluid>
      <v-card>
        <v-card max-width="450" tile>
          <v-subheader
            ><v-text-field
              class="mx-3 my-1"
              v-model="searchQuery"
              flat
              single-line
              hide-details
              label="Search"
              v-on:keyup.enter="search"
            ></v-text-field
          ></v-subheader>
          <v-list three-line>
            <v-subheader v-if="!conversations.length">Empty!</v-subheader>
            <template v-for="(conversation, index) in conversations">
              <v-divider :key="index"></v-divider>
              <v-list-item
                :key="index + 'divider'"
                @click="selectConversation(conversation)"
              >
                <v-list-item-avatar>
                  <v-img :src="conversation.avatar"></v-img>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title
                    v-html="conversation.title"
                  ></v-list-item-title>
                  <v-list-item-subtitle
                    v-html="conversation.subtitle"
                  ></v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
          </v-list>
        </v-card>
      </v-card>
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
} from "../pb/api_pb"
import { client } from "../api"

export default Vue.extend({
  data: () => ({
    searchQuery: null as null | string,
    conversations: [
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/1.jpg",
        title: "Brunch this weekend?",
        subtitle:
          "<span class='text--primary'>Ali Connors</span> &mdash; I'll be in your neighborhood doing errands this weekend. Do you want to hang out?",
      },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/2.jpg",
        title: 'Summer BBQ <span class="grey--text text--lighten-1">4</span>',
        subtitle:
          "<span class='text--primary'>to Alex, Scott, Jennifer</span> &mdash; Wish I could come, but I'm out of town this weekend.",
      },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/3.jpg",
        title: "Oui oui",
        subtitle:
          "<span class='text--primary'>Sandra Adams</span> &mdash; Do you have Paris recommendations? Have you ever been?",
      },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/4.jpg",
        title: "Birthday gift",
        subtitle:
          "<span class='text--primary'>Trevor Hansen</span> &mdash; Have any ideas about what we should get Heidi for her birthday?",
      },
      {
        avatar: "https://cdn.vuetifyjs.com/images/lists/5.jpg",
        title: "Recipe to try",
        subtitle:
          "<span class='text--primary'>Britta Holt</span> &mdash; We should eat this: Grate, Squash, Corn, and tomatillo Tacos.",
      },
    ],
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
    handle,

    search() {
      console.log("Search for", this.searchQuery)
    },

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
        .then(() => {
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
        .then(() => {
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
