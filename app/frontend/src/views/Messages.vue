<template>
  <v-main>
    <v-container fluid>
      <v-row dense>
        <v-col cols="4">
          <v-card tile>
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
                  :key="conversation.groupChatId"
                  @click="selectConversation(conversation.groupChatId)"
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
                >Selected conversation: {{ selectedConversation }}</v-subheader
              >
              <template v-for="message in messages">
                <v-list-item
                  v-if="isMyMessage(message)"
                  :key="message.messageId"
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
                      {{ message.text }}
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
                <v-list-item v-else :key="message.messageId">
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
                      {{ message.text }}
                    </v-alert>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
          <v-card tile>
            <v-text-field
              v-model="currentMessage"
              autofocus
              :disabled="!selectedConversation"
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
  </v-main>
</template>

<script lang="ts">
import Vue from "vue"
import moment from "moment"

import { handle, protobufTimestampToDate } from "../utils"

import { User, GetUserReq } from "../pb/api_pb"
import {
  ListGroupChatsReq,
  GroupChat,
  Message,
  GetGroupChatMessagesReq,
  SendMessageReq,
  GetUpdatesReq,
} from "../pb/conversations_pb"
import { client, conversations } from "../api"
import { mapState } from "vuex"

export default Vue.extend({
  data: () => ({
    loading: 0,
    currentMessage: "",
    searchQuery: null as null | string,
    conversations: [] as Array<GroupChat.AsObject>,
    userCache: {} as { [userId: number]: User.AsObject },
    selectedConversation: null as null | number, // TODO: null by default
    messages: [] as Array<Message.AsObject>,
  }),

  computed: mapState(["user"]),

  created() {
    this.fetchData()
  },

  watch: {
    selectedConversation() {
      this.messages = []
      console.debug("Selected conversation changed, fetching messages")
      const req = new GetGroupChatMessagesReq()
      req.setGroupChatId(this.selectedConversation!)
      conversations
        .getGroupChatMessages(req)
        .then((res) => {
          this.messages = res.getMessagesList().map((msg) => msg.toObject())
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
          protobufTimestampToDate(f.time!).getTime() -
          protobufTimestampToDate(s.time!).getTime()
      )
    },

    getUser(userId: number): null | User.AsObject {
      if (!(userId in this.userCache)) {
        console.debug("Pretend to fetch user")
        // TODO: do this async stuff
        return null
      } else {
        return this.userCache[userId]
      }
    },

    search() {
      console.debug("Search for", this.searchQuery)
      // TODO
    },

    sendMessage() {
      if (!this.selectedConversation) {
        console.error("No conversation selected")
      } else {
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
      }
    },

    fetchUpdates() {
      const req = new GetUpdatesReq()
      req.setNewestMessageId(
        Math.max(0, ...this.messages.map((msg) => msg.messageId))
      )
      conversations
        .getUpdates(req)
        .then((res) => {
          res
            .getUpdatesList()
            .filter(
              (update) => update.getGroupChatId() === this.selectedConversation
            )
            .map((update) => update.getMessage()!)
            .forEach((msg) => {
              this.messages.push(msg.toObject())
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
          this.conversations = res
            .getGroupChatsList()
            .map((chat) => chat.toObject())
          const userIds = new Set() as Set<number>
          this.conversations.forEach((conv) => {
            conv.memberUserIdsList.forEach((userId) => userIds.add(userId))
          })
          userIds.forEach((userId) => {
            this.loading += 1
            const req = new GetUserReq()
            req.setUser(userId.toString())
            client
              .getUser(req)
              .then((res) => {
                this.loading -= 1
                this.userCache[res.getUserId()] = res.toObject()
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

    conversationChip(conversation: GroupChat.AsObject) {
      return conversation.unseenMessageCount
    },

    conversationAvatar(conversation: GroupChat.AsObject) {
      const user = this.getUser(conversation.latestMessage!.authorUserId)
      if (user) {
        return user.color
      } else {
        return "red" // TODO
      }
    },

    conversationTitle(conversation: GroupChat.AsObject) {
      if (conversation.isDm) {
        const otherUserId = conversation.memberUserIdsList.filter(
          (userId) => userId != this.user.userId
        )[0]
        const otherUser = this.userCache[otherUserId]
        return `${otherUser.name} (${handle(otherUser.username)})`
      }
      return conversation.title || "<i>Untitled</i>"
    },

    conversationSubtitle(conversation: GroupChat.AsObject) {
      const message = conversation.latestMessage!
      return (
        `<b>${this.messageAuthor(message)}</b>: ${message.text}` ||
        "<i>No messages</i>"
      )
    },

    selectConversation(conversationId: number) {
      this.selectedConversation = conversationId
    },

    messageColor(message: Message.AsObject) {
      const user = this.getUser(message.authorUserId)
      if (!user) {
        return "red"
      }
      return user.color
    },

    messageAuthor(message: Message.AsObject) {
      const user = this.getUser(message.authorUserId)
      if (!user) {
        return "error"
      }
      return user.name.split(" ")[0]
    },

    messageAvatarText(message: Message.AsObject) {
      const user = this.getUser(message.authorUserId)
      if (!user) {
        return "ERR"
      }
      return user.name
        .split(" ")
        .map((name) => name[0])
        .join("")
    },

    messageDisplayTime(message: Message.AsObject) {
      const date = protobufTimestampToDate(message.time!)
      if (new Date().getTime() - date.getTime() > 120 * 60 * 1000) {
        // longer than 2h ago, display as absolute
        return moment(date).format("lll")
      } else {
        // relative
        return moment(date).fromNow()
      }
    },

    isMyMessage(message: Message.AsObject) {
      return message.authorUserId === this.user.userId
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
