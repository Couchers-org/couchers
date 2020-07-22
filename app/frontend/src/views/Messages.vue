<template>
  <v-main>
    <v-container fluid>
      DEBUG your user ID: <v-text-field v-model="myUserId"></v-text-field>
      <v-container fluid>
        <v-row dense>
          <v-col cols="4">
            <v-card max-width="450" tile>
              <v-list v-if="loading != 0" three-line>
                <v-subheader>Loading...</v-subheader>
              </v-list>
              <v-list v-if="loading == 0" two-line>
                <v-list-item>
                  <v-text-field
                    v-model="searchQuery"
                    single-line
                    solo
                    flat
                    hide-details
                    label="Search"
                    prepend-icon="mdi-magnify"
                    v-on:keyup.enter="search"
                  ></v-text-field>
                </v-list-item>
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
                        v-if="conversationChip(conversation)"
                        color="primary"
                        v-text="conversationChip(conversation)"
                        small
                      />
                    </v-list-item-avatar>
                  </v-list-item>
                </template>
              </v-list>
            </v-card>
          </v-col>
          <v-col cols="8">
            <v-card tile height="600" style="overflow: auto;">
              <v-subheader v-if="selectedConversation === null"
                >Select a conversation...</v-subheader
              >
              <v-list v-else dense>
                <v-subheader
                  >Selected conversation:
                  {{ selectedConversation }}</v-subheader
                >
                <template v-for="message in messages">
                  <v-list-item
                    v-if="isMyMessage(message)"
                    :key="message.getMessageId()"
                  >
                    <v-list-item-content class="py-1 bubble-content">
                      <v-alert
                        :color="messageColor(message)"
                        class="white--text my-0 bubble-alert-mine"
                        dense
                      >
                        <div class="subtitle mb-1">
                          <b>{{ messageAuthor(message) }}</b> at
                          {{ messageDisplayTime(message) }}
                        </div>
                        {{ message.getText() }}
                      </v-alert>
                    </v-list-item-content>
                    <v-list-item-avatar>
                      <v-avatar :color="messageColor(message)" size="36">
                        <span class="white--text">{{
                          messageAvatarText(message)
                        }}</span>
                      </v-avatar>
                    </v-list-item-avatar>
                  </v-list-item>
                  <v-list-item v-else :key="message.getMessageId()">
                    <v-list-item-avatar>
                      <v-avatar :color="messageColor(message)" size="36">
                        <span class="white--text">{{
                          messageAvatarText(message)
                        }}</span>
                      </v-avatar>
                    </v-list-item-avatar>
                    <v-list-item-content class="py-1 bubble-content">
                      <v-alert
                        :color="messageColor(message)"
                        class="white--text my-0 bubble-alert-theirs"
                        dense
                      >
                        <div class="subtitle mb-1">
                          <b>{{ messageAuthor(message) }}</b> at
                          {{ messageDisplayTime(message) }}
                        </div>
                        {{ message.getText() }}
                      </v-alert>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-list>
            </v-card>
            <v-card tile>
              <v-text-field
                v-model="currentMessage"
                solo
                flat
                single-line
                hide-details
                label="Send a message"
                append-icon="mdi-send"
                @click:append="sendMessage"
                v-on:keyup.enter="sendMessage"
              ></v-text-field>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"
import moment from "moment"

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
import {
  ListGroupChatsReq,
  GroupChat,
  Message,
  GetGroupChatMessagesReq,
  SendMessageReq,
  GetUpdatesReq,
} from "../pb/conversations_pb"
import { client, conversations } from "../api"

export default Vue.extend({
  data: () => ({
    loading: 0,
    currentMessage: "",
    myUserId: 2, // TODO TODO TODO
    searchQuery: null as null | string,
    conversations: [] as Array<GroupChat>,
    userCache: {} as { [userId: number]: User },
    selectedConversation: null as null | number, // TODO: null by default
    messages: [] as Array<Message>,
  }),

  created() {
    this.fetchData()
  },

  watch: {
    selectedConversation() {
      this.messages = []
      console.log("selected conversation changed, fetching messages")
      const req = new GetGroupChatMessagesReq()
      req.setGroupChatId(this.selectedConversation)
      conversations
        .getGroupChatMessages(req)
        .then((res) => {
          this.messages = res.getMessagesList()
          this.sortMessages()
        })
        .catch(console.error)
    },
  },

  methods: {
    handle,

    sortMessages() {
      this.messages = this.messages.sort(
        (f, s) =>
          f.getTime().toDate().getTime() - s.getTime().toDate().getTime()
      )
    },

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

    sendMessage() {
      const req = new SendMessageReq()
      req.setGroupChatId(this.selectedConversation)
      req.setText(this.currentMessage)
      conversations
        .sendMessage(req)
        .then((res) => {
          this.currentMessage = ""
          this.fetchUpdates()
        })
        .catch(console.error)
    },

    fetchUpdates() {
      const req = new GetUpdatesReq()
      req.setNewestMessageId(
        Math.max(0, ...this.messages.map((msg) => msg.getMessageId()))
      )
      conversations
        .getUpdates(req)
        .then((res) => {
          res
            .getUpdatesList()
            .filter(
              (update) => update.getGroupChatId() === this.selectedConversation
            )
            .map((update) => update.getMessage())
            .forEach((msg) => {
              this.messages.push(msg)
            })
          this.sortMessages()
        })
        .catch(console.error)
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
      const message = conversation.getLatestMessage()
      return (
        `<b>${this.messageAuthor(message)}</b>: ${message.getText()}` ||
        "<i>No messages</i>"
      )
    },

    selectConversation(conversationId: number) {
      this.selectedConversation = conversationId
    },

    messageColor(message: Message) {
      const user = this.getUser(message.getAuthorUserId())
      if (!user) {
        return "red"
      }
      return user.getColor()
    },

    messageAuthor(message: Message) {
      const user = this.getUser(message.getAuthorUserId())
      if (!user) {
        return "error"
      }
      return user.getName().split(" ")[0]
    },

    messageAvatarText(message: Message) {
      const user = this.getUser(message.getAuthorUserId())
      if (!user) {
        return "ERR"
      }
      return user
        .getName()
        .split(" ")
        .map((name) => name[0])
        .join("")
    },

    messageDisplayTime(message: Message) {
      const date = message.getTime().toDate()
      if (new Date().getTime() - date.getTime() > 120 * 60 * 1000) {
        // longer than 2h ago, display as absolute
        return moment(date).format("lll")
      } else {
        // relative
        return moment(date).fromNow()
      }
    },

    isMyMessage(message: Message) {
      return message.getAuthorUserId() === this.myUserId
    },
  },
})
</script>

<style scoped>
.bubble-content {
  display: block;
}

.bubble-alert-theirs {
  float: left;
}

.bubble-alert-mine {
  float: right;
}
</style>
