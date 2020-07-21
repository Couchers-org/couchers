<template>
  <v-main>
    <v-container fluid>
      DEBUG your user ID: <v-text-field v-model="myUserId"></v-text-field>
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
          <v-list v-if="loading != 0" three-line>
            <v-subheader>Loading...</v-subheader>
          </v-list>
          <v-list v-if="loading == 0" three-line>
            <v-subheader v-if="!conversations.length">Empty!</v-subheader>
            <template v-for="(conversation, index) in conversations">
              <v-divider :key="index"></v-divider>
              <v-list-item
                :key="index + 'divider'"
                @click="selectConversation(conversation)"
              >
                <v-list-item-avatar>
                  <v-avatar :color="conversationAvatar(conversation)" />
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title
                    v-html="conversationTitle(conversation)"
                  ></v-list-item-title>
                  <v-list-item-subtitle
                    v-html="conversationSubtitle(conversation)"
                  ></v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-avatar>
                  <v-chip
                    color="primary"
                    v-text="conversationChip(conversation)"
                    small
                    outlined
                  />
                </v-list-item-avatar>
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
import Store, { AuthenticationState } from "../store"

import {
  FriendRequest,
  RespondFriendRequestReq,
  CancelFriendRequestReq,
  User,
  GetUserReq,
} from "../pb/api_pb"
import { ListGroupChatsReq, GroupChat } from "../pb/conversations_pb"
import { client, conversations } from "../api"

export default Vue.extend({
  data: () => ({
    myUserId: 2, // TODO TODO TODO
    searchQuery: null as null | string,
    conversations: [] as Array<GroupChat>,
    userCache: {} as { [userId: number]: User },
    conversationsOld: [
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
    loading: 0,
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

    getUser(userId: number) {
      if (!(userId in this.userCache)) {
        console.log("pretend to fetch user")
        return null
      } else {
        return this.userCache[userId]
      }
    },

    search() {
      console.log("Search for", this.searchQuery)
    },

    fetchData() {
      this.loading += 1
      this.errorMessage = ""
      const req = new ListGroupChatsReq()
      conversations
        .listGroupChats(req)
        .then((res) => {
          this.loading -= 1
          this.conversations = res.getGroupChatsList()
          const userIds = new Set()
          this.conversations.forEach((conv) => {
            conv.getMemberUserIdsList().forEach((userId) => userIds.add(userId))
          })
          userIds.forEach((userId) => {
            this.loading += 1
            const req = new GetUserReq()
            req.setUser(userId.toString())
            client
              .getUser(req)
              .then((res) => {
                this.loading -= 1
                this.userCache[res.getUserId()] = res
              })
              .catch((err) => {
                this.loading -= 1
                console.error(err)
              })
          })
          console.log(res.toObject())
        })
        .catch((err) => {
          this.loading -= 1
          console.error(err)
        })
    },

    conversationChip(conversation: GroupChat) {
      return conversation.getUnseenMessageCount()
    },

    conversationAvatar(conversation: GroupChat) {
      const user = this.getUser(
        conversation.getLatestMessage().getAuthorUserId()
      )
      if (user) {
        return user.getColor()
      } else {
        return "red" // TODO
      }
    },

    conversationTitle(conversation: GroupChat) {
      if (conversation.getIsDm()) {
        const otherUserId = conversation
          .getMemberUserIdsList()
          .filter((userId) => userId != this.myUserId)[0]
        const otherUser = this.userCache[otherUserId]
        return `${otherUser.getName()} (${handle(otherUser.getUsername())})`
      }
      return conversation.getTitle() || "<i>Untitled</i>"
    },

    conversationSubtitle(conversation: GroupChat) {
      return conversation.getLatestMessage().getText() || "<i>No messages</i>"
    },
  },
})
</script>
