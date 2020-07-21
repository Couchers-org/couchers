<template>
  <v-main>
    <v-container fluid>
      DEBUG your user ID: <v-text-field v-model="myUserId"></v-text-field>
      <v-container fluid>
        <v-row dense>
          <v-col cols="4">
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
                  <v-divider :key="index + 'divider'"></v-divider>
                  <v-list-item
                    :key="conversation.getGroupChatId()"
                    @click="selectConversation(conversation.getGroupChatId())"
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
          </v-col>
          <v-col cols="8">
            <v-card tile>
              <v-subheader>Select a conversation...</v-subheader>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
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
    loading: 0,
    myUserId: 2, // TODO TODO TODO
    searchQuery: null as null | string,
    conversations: [] as Array<GroupChat>,
    userCache: {} as { [userId: number]: User },
  }),

  created() {
    this.fetchData()
  },

  methods: {
    handle,

    getUser(userId: number) {
      if (!(userId in this.userCache)) {
        console.log("pretend to fetch user")
        // TODO: do this async stuff
        return null
      } else {
        return this.userCache[userId]
      }
    },

    search() {
      console.log("Search for", this.searchQuery)
      // TODO
    },

    fetchData() {
      this.loading += 1
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

    selectConversation(conversationId: number) {
      console.log("selecting conversation id", conversationId)
    },
  },
})
</script>
